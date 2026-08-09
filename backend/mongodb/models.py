from pydantic import Field
from datetime import UTC, datetime
from bson import ObjectId
from pydantic import BaseModel, ConfigDict


class User(BaseModel):
    """User account record with a hashed password."""

    name: str
    
    email: str

    phno: str
    
    password: str

    role: str
    
    email_verified: bool
    
    phone_verify_required: bool
    
    profile_required: bool

class UserSession(BaseModel):
    """Stored refresh-token hash for a login session."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    session_id: str
    user_id: ObjectId
    refreshtoken: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

class Announcement(BaseModel):
    """System-wide announcement."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    title: str
    content: str
    author_id: str
    author_name: str
    author_role: str
    created_at: datetime
    updated_at: datetime


class Rider(BaseModel):
    """Rider search request (findride) stored in riders collection."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    user_id: ObjectId
    start_location: str
    end_destination: str
    start_lat: float
    start_lon: float
    dest_lat: float
    dest_lon: float
    h3_pickup_cell: str | None = None
    date_time: datetime
    no_of_seats: int
    status: str


class RiderOffer(BaseModel):
    """Rider offer request (offerride) stored in rideroffers collection."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    user_id: ObjectId
    start_location: str
    end_destination: str
    start_lat: float
    start_lon: float
    dest_lat: float
    dest_lon: float
    date_time: datetime
    available_seats: int
    cost_per_seat: float