import os

from dotenv import load_dotenv
from pymongo.asynchronous.mongo_client import AsyncMongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DB_NAME", "Odoo")

client = AsyncMongoClient(MONGO_URI)

database = client[DATABASE_NAME]