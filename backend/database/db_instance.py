from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from database.create_engine import engine

# Async session factory
db = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a request-scoped async database session for FastAPI dependencies."""

    async with db() as session:
        yield session
