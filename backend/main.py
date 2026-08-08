"""FastAPI application exposing signup, login, refresh, view, and logout APIs."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, FastAPI, HTTPException, status

from database.create_tables import init_db

from database.db_instance import get_db
from dependency.token_dependency import security, verify_access_token, verify_refresh_token
from api.authentication import router as auth_router

@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    await init_db()
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

