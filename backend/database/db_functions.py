from contextlib import suppress
from dataclasses import dataclass
from uuid import uuid4

from sqlalchemy import delete, literal, select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import load_only

from database.tables import User, UserSession
from security.hash_and_verify import hash_keyword, verify_keyword


async def _rollback_safely(session: AsyncSession) -> None:
    with suppress(SQLAlchemyError):
        await session.rollback()


async def create_user(session: AsyncSession, username: str, password: str) -> bool:
    """Create a user when the username is available."""

    try:
        result = await session.execute(
            select(User).where(User.username == username)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user is not None:
            return False
    except SQLAlchemyError:
        return False

    user = User(
        username=username,
        password=hash_keyword(password),
    )

    try:
        session.add(user)
        await session.commit()

        return True
    except SQLAlchemyError:
        await _rollback_safely(session)
        return False


@dataclass
class LoginResult:
    success: bool
    user_id: str | None = None
    session_id: str | None = None


async def verify_login_user(
    session: AsyncSession,
    username: str,
    password: str,
) -> LoginResult:
    """Validate login credentials against the stored password hash."""

    try:
        result = await session.execute(
            select(User)
            .options(load_only(User.id, User.password))
            .where(User.username == username)
        )

        user = result.scalar_one_or_none()
    except SQLAlchemyError:
        return LoginResult(False)

    if user is None:
        return LoginResult(False)

    if not verify_keyword(password, user.password):
        return LoginResult(False)

    session_id = str(uuid4())

    return LoginResult(True, user.id, session_id=session_id)


async def save_refresh_token(
    db: AsyncSession,
    user_id: str,
    session_id: str,
    refresh_token_value: str,
) -> bool:
    """Store a hashed refresh token for later rotation and logout checks."""

    try:
        user_session = UserSession(
            session_id=session_id,
            user_id=user_id,
            refreshtoken=hash_keyword(refresh_token_value),
        )
        db.add(user_session)
        await db.commit()

        return True

    except SQLAlchemyError:
        await _rollback_safely(db)
        return False


async def verify_stored_refresh_token(
    session: AsyncSession,
    user_id: str,
    session_id: str,
    refresh_token_value: str,
) -> bool:
    """Confirm that a presented refresh token matches the stored hash."""

    try:
        result = await session.execute(
            select(UserSession.refreshtoken).where(
                UserSession.session_id == session_id,
                UserSession.user_id == user_id,
            )
        )
        stored_refresh_token = result.scalar_one_or_none()
    except SQLAlchemyError:
        return False

    if stored_refresh_token is None:
        return False

    return verify_keyword(refresh_token_value, stored_refresh_token)


async def update_new_refresh_token(
    db: AsyncSession,
    user_id: str,
    session_id: str,
    refreshtoken: str,
) -> bool:
    """Replace the stored refresh-token hash after a successful refresh."""

    try:
        await db.execute(
            update(UserSession)
            .where(
                UserSession.session_id == session_id,
                UserSession.user_id == user_id,
            )
            .values(refreshtoken=hash_keyword(refreshtoken))
        )
        await db.commit()
        return True

    except SQLAlchemyError:
        await _rollback_safely(db)
        return False


async def clear_refresh_token(
    session: AsyncSession,
    user_id: str,
    session_id: str,
) -> bool:
    """Remove the stored refresh token hash when a user logs out."""

    try:
        result = await session.execute(
            delete(UserSession)
            .where(
                UserSession.session_id == session_id,
                UserSession.user_id == user_id,
            )
        )
        await session.commit()

        if result.rowcount > 0:
            return True

        return False
    except SQLAlchemyError:
        await _rollback_safely(session)
        return False


async def is_refresh_token_in_db(
    user_id: str,
    session_id: str,
    db: AsyncSession,
) -> bool:
    """Return whether a login session has a stored refresh token."""

    try:
        result = await db.execute(
            select(literal(True))
            .where(
                UserSession.session_id == session_id,
                UserSession.user_id == user_id,
            )
            .limit(1)
        )
        refresh_token_exists = result.scalar_one_or_none()
    except SQLAlchemyError:
        return False

    return refresh_token_exists is True
