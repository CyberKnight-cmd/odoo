from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from auth_jwt.create_tokens import verify_token
from mongodb.db_functions.auth import get_user_role, is_refresh_token_in_db
from database.db_instance import get_db


security = HTTPBearer()


# Standard 401 response raised whenever bearer-token validation fails.
credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

async def verify_admin_access_token(
    token: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Require a valid access token for routes that read protected resources."""

    payload = verify_token(token.credentials)

    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    real_role = await get_user_role(user_id=payload['sub'])

    if (real_role != "ADMIN"):
        raise credentials_exception

    rt_in_db = await is_refresh_token_in_db(payload["session_id"])

    if not rt_in_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User already logged out",
        )

    return payload


async def verify_user_access_token(
    token: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Require a valid access token for routes that read protected resources."""

    payload = verify_token(token.credentials)

    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    real_role = await get_user_role(user_id=payload['sub'])

    if (real_role != "USER"):
        raise credentials_exception

    rt_in_db = await is_refresh_token_in_db(payload["session_id"])

    if not rt_in_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User already logged out",
        )

    return payload


async def verify_access_token(
    token: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Require a valid access token for routes that read protected resources."""

    payload = verify_token(token.credentials)

    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    rt_in_db = await is_refresh_token_in_db(payload["session_id"])

    if not rt_in_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User already logged out",
        )

    return payload


async def verify_refresh_token(
    token: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Require a valid refresh token for token rotation routes."""

    payload = verify_token(token.credentials)

    if payload is None or payload.get("type") != "refresh":
        raise credentials_exception

    real_role = await get_user_role(user_id=payload['sub'])

    if (payload['role'] != real_role):
        raise credentials_exception

    rt_in_db = await is_refresh_token_in_db(payload["session_id"])

    if not rt_in_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User already logged out",
        )

    return payload
