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
