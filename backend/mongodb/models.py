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