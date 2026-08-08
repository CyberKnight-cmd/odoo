from uuid import uuid4

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models in this application."""

    pass


class User(Base):
    """User account record with a hashed password."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(255),
        primary_key=True,
        index=True,
        default=lambda: str(uuid4()),
    )
    username: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    password: Mapped[str] = mapped_column(String(255), nullable=False)


class UserSession(Base):
    """Stored refresh-token hash for a login session."""

    __tablename__ = "sessions"

    session_id: Mapped[str] = mapped_column(
        String(255),
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )
    refreshtoken: Mapped[str | None] = mapped_column(
        String(255), nullable=True)
