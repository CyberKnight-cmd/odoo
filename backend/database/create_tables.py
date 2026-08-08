from database.create_engine import engine
from database.tables import Base


async def init_db() -> None:
    """Create database tables that are missing from the configured database."""

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
