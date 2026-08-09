from datetime import datetime
from pydantic import BaseModel, EmailStr


class SignUpRequest(BaseModel):
    """Request body expected by the signup endpoint."""

    name: str
    phno: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    """Request body expected by the login endpoint."""

    email: EmailStr
    phno: str
    password: str


class FindRideRequest(BaseModel):
    start_location: str
    end_destination: str
    start_lat: float
    start_lon: float
    dest_lat: float
    dest_lon: float
    date_time: datetime
    no_of_seats: int
    status: str = "pending"


class OfferRideRequest(BaseModel):
    start_location: str
    end_destination: str
    start_lat: float
    start_lon: float
    dest_lat: float
    dest_lon: float
    date_time: datetime
    available_seats: int
    cost_per_seat: float
