from datetime import datetime
from pydantic import BaseModel, EmailStr


class SignUpResponse(BaseModel):
    """Response body expected by the signup endpoint."""

    status: str


class LoginResponse(BaseModel):
    """Response body expected by the login endpoint."""

    accesstoken: str
    refreshtoken: str
    role: str

class RefreshResponse(BaseModel):
    """Response body expected by the refresh endpoint."""
    
    accesstoken: str
    refreshtoken: str
    
class LogOutResponse(BaseModel):
    """Response body expected by the logout endpoint."""

    status: str

class GetAllUsersResponse(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    phno: str
    role: str
    
class UpdateRoleResponse(BaseModel):
    status: str


class FindRideResponse(BaseModel):
    status: str


class OfferRideResponse(BaseModel):
    status: str


class ObserveStatusResponse(BaseModel):
    status: str


class RiderDetailsResponse(BaseModel):
    user_id: str
    start_location: str
    end_destination: str
    start_lat: float | None = None
    start_lon: float | None = None
    dest_lat: float | None = None
    dest_lon: float | None = None
    date_time: datetime
    no_of_seats: int
    status: str
    pickup_distance_km: float | None = None
    pickup_eta_minutes: float | None = None
    match_score: float | None = None


class DriverOfferDetailsResponse(BaseModel):
    offer_id: str
    driver_id: str
    start_location: str
    end_destination: str
    date_time: datetime
    available_seats: int
    cost_per_seat: float

class SearchDriversResponse(BaseModel):
    results: list[DriverOfferDetailsResponse]

class SearchRidersResponse(BaseModel):
    results: list[RiderDetailsResponse]

class UpdateStatusResponse(BaseModel):
    status: str


class PaginatedUsersResponse(BaseModel):
    total: int
    page: int
    limit: int
    users: list[GetAllUsersResponse]


class PaginatedRidersResponse(BaseModel):
    total: int
    page: int
    limit: int
    riders: list[RiderDetailsResponse]


class DeleteUserResponse(BaseModel):
    status: str