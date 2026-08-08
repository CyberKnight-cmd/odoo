

import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine


load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")

# The engine and session factory are module-level singletons shared by FastAPI
# dependencies for the lifetime of the application process.
engine = create_async_engine(DATABASE_URL, echo=False)
