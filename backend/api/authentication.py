
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, Request, logger, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from Request_and_Response.Requests import LoginRequest, SignUpRequest
from Request_and_Response.Responses import (
    LogOutResponse,
    LoginResponse,
    RefreshResponse,
    SignUpResponse,
)

from auth_jwt.create_tokens import TokenUser, create_access_token, refresh_token
from mongodb.db_functions.auth import (
    clear_refresh_token,
    create_user,
    save_refresh_token,
    update_new_refresh_token,
    verify_login_user,
    verify_stored_refresh_token,
)
from dependency.token_dependency import security, verify_access_token, verify_refresh_token

from fastapi import APIRouter


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post(
    "/signup",
    response_model=SignUpResponse,
    status_code=status.HTTP_201_CREATED,
)
async def signup(
    signup_cred: SignUpRequest
) -> dict[str, str]:
    """Register a new user with a unique username."""

    await create_user(
        signup_cred
    )

    return {"status": "Entry successful"}


@router.post("/login", response_model=LoginResponse)
async def login(
    login_cred: LoginRequest,
) -> dict[str, str]:
    """Authenticate a user and issue a fresh access/refresh token pair."""

    login_result = await verify_login_user(
        login_cred.email,
        login_cred.phno,
        login_cred.password
    )

    if not login_result.success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token_user = TokenUser(
        user_id=login_result.user_id,
        session_id=login_result.session_id,
        role=login_result.role
    )

    access_token = create_access_token(token_user)
    refresh_token_value = refresh_token(token_user)

    # Store only a refresh-token hash.
    refresh_token_saved = await save_refresh_token(
        login_result.user_id,
        login_result.session_id,
        refresh_token_value,
    )

    if not refresh_token_saved:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    return {
        "accesstoken": access_token,
        "refreshtoken": refresh_token_value,
        'role': login_result.role
    }


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    payload: dict = Depends(verify_refresh_token),
    token: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, str]:
    """Rotate a valid refresh token into a new access/refresh token pair."""

    is_valid_refresh_token: bool = await verify_stored_refresh_token(
        payload["sub"],
        payload["session_id"],
        token.credentials,
    )

    if not is_valid_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    token_user = TokenUser(
        user_id=payload["sub"],
        session_id=payload["session_id"],
        role = payload['role']
    )
    access_token = create_access_token(token_user)
    refresh_token_value = refresh_token(token_user)

    # Each successful refresh replaces the stored token hash.
    refresh_token_saved = await update_new_refresh_token(
        token_user.user_id,
        token_user.session_id,
        refresh_token_value,
    )

    if not refresh_token_saved:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    return {
        "accesstoken": access_token,
        "refreshtoken": refresh_token_value,
    }


@router.post("/logout", response_model=LogOutResponse)
async def logout(
    payload: dict = Depends(verify_access_token),
) -> dict[str, str]:
    """Invalidate the user's saved refresh token while keeping the API stateless."""

    refresh_token_cleared = await clear_refresh_token(
        payload["sub"],
        payload["session_id"],
    )

    if not refresh_token_cleared:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return {"status": "Logout successful"}
