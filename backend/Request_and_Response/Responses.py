from pydantic import BaseModel


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