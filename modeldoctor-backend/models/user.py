"""Pydantic models for authentication request/response schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field, EmailStr


# ───── Request Models ─────


class UserRegisterRequest(BaseModel):
    """Request body for POST /auth/register."""

    username: str = Field(
        ..., min_length=3, max_length=32, description="Unique username"
    )
    email: str = Field(..., description="User email address")
    password: str = Field(
        ..., min_length=6, max_length=128, description="Account password"
    )


class UserLoginRequest(BaseModel):
    """Request body for POST /auth/login."""

    username: str = Field(..., description="Username")
    password: str = Field(..., description="Account password")


# ───── Response Models ─────


class UserResponse(BaseModel):
    """Public user info returned by /auth/me."""

    id: str
    username: str
    email: str


class TokenResponse(BaseModel):
    """JWT token returned after login/register."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
