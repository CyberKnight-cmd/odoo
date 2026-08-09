"""FastAPI application exposing signup, login, refresh, view, and logout APIs."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
import random
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from database.create_tables import init_db
from api.authentication import router as auth_router
from api.admin import router as admin_router
from api.user import router as user_router

from mongodb.collections import users, riders, rideroffers
from mongodb.models import Rider, RiderOffer
from mongodb.indexes import init_indexes

@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    await init_indexes()
    yield


app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",   # React
    "http://127.0.0.1:3000",
    "http://10.172.144.160:5173",   # Vite
    "http://10172.144.255:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # allowed frontend URLs
    allow_credentials=True,
    allow_methods=["*"],            # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"]            # Authorization, Content-Type, etc.
)


@app.get("/week5")
def start() -> dict[str, str]:
    return {"status": "Winning Odoo"}

app.include_router(auth_router)

app.include_router(admin_router)

app.include_router(user_router)

@app.get("/hello")
async def hello():
    users_cursor = users.find({})
    all_users = await users_cursor.to_list(length=None)

    for user in all_users:
        user_id = user.get("_id")
        if not user_id:
            continue

        user_obj_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id

        riders_doc = Rider(
            user_id=user_obj_id,
            start_location=user.get("name", "Unknown"),
            end_destination=user.get("email", "unknown@example.com"),
            date_time=datetime.now(UTC),
            no_of_seats=random.randint(1, 4),
            status="PENDING",
        )
        await riders.insert_one(riders_doc.model_dump())

        offers_doc = RiderOffer(
            user_id=user_obj_id,
            start_location=user.get("name", "Unknown"),
            end_destination=user.get("email", "unknown@example.com"),
            date_time=datetime.now(UTC),
            available_seats=random.randint(1, 4),
            cost_per_seat=round(random.uniform(5.0, 50.0), 2),
        )
        await rideroffers.insert_one(offers_doc.model_dump())

    return {"status": "User rider migration completed"}
