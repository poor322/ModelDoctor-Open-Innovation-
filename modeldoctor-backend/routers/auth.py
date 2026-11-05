"""Authentication endpoints — register, login, and user info."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies.auth import get_current_user
from models.user import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from services.auth_service import (
    authenticate_user,
    create_access_token,
    register_user,
)

logger = logging.getLogger("modeldoctor.auth")
router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: UserRegisterRequest) -> TokenResponse:
    """Create a new account and return a JWT."""
    try:
        user = register_user(
            username=request.username,
            email=request.email,
            password=request.password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )

    token = create_access_token(data={"sub": user["id"], "username": user["username"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(**user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest) -> TokenResponse:
    """Authenticate and return a JWT."""
    user = authenticate_user(username=request.username, password=request.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    token = create_access_token(data={"sub": user["id"], "username": user["username"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(**user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user's info."""
    return UserResponse(**current_user)
