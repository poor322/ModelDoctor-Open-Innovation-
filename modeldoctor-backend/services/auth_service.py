"""Authentication service — password hashing, JWT tokens, in-memory user store.

This module keeps all auth logic in one place so it can later be
swapped to a database-backed store with minimal changes.
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

logger = logging.getLogger("modeldoctor.auth")

# ──────────────────────────── Config ────────────────────────────

SECRET_KEY: str = os.getenv("AUTH_SECRET_KEY", "modeldoctor-dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# ──────────────────────────── Password Hashing ────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ──────────────────────────── JWT ────────────────────────────


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT with the given payload."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT. Returns payload or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ──────────────────────────── In-Memory User Store ────────────────────────────

# Schema: { user_id: { "id": str, "username": str, "email": str, "hashed_password": str } }
_users: dict[str, dict] = {}
_username_index: dict[str, str] = {}  # username -> user_id (for fast lookup)


def register_user(username: str, email: str, password: str) -> dict:
    """Register a new user. Returns user dict (without password).

    Raises:
        ValueError: If the username is already taken.
    """
    normalized = username.strip().lower()
    if normalized in _username_index:
        raise ValueError(f"Username '{username}' is already taken.")

    user_id = uuid.uuid4().hex[:12]
    user = {
        "id": user_id,
        "username": username.strip(),
        "email": email.strip(),
        "hashed_password": hash_password(password),
    }
    _users[user_id] = user
    _username_index[normalized] = user_id

    logger.info("Registered user '%s' (id=%s)", username, user_id)
    return {k: v for k, v in user.items() if k != "hashed_password"}


def authenticate_user(username: str, password: str) -> Optional[dict]:
    """Validate credentials. Returns user dict (without password) or None."""
    normalized = username.strip().lower()
    user_id = _username_index.get(normalized)
    if not user_id:
        return None

    user = _users[user_id]
    if not verify_password(password, user["hashed_password"]):
        return None

    return {k: v for k, v in user.items() if k != "hashed_password"}


def get_user_by_id(user_id: str) -> Optional[dict]:
    """Look up user by ID. Returns user dict (without password) or None."""
    user = _users.get(user_id)
    if not user:
        return None
    return {k: v for k, v in user.items() if k != "hashed_password"}
