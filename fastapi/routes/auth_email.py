import os
import secrets
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, EmailStr

from auth import hash_password
from database import (
    connect_db,
    get_user_by_identifier,
    insert_user,
    set_email_verification,
    get_user_by_verification_token,
    mark_user_verified,
)
from email_utils import send_verification_email


router = APIRouter()


class RegisterPayload(BaseModel):
    real_name: str
    email: EmailStr
    password: str


async def ensure_db():
    await connect_db()


@router.post("/auth/register", dependencies=[Depends(ensure_db)])
async def register_user(payload: RegisterPayload):
    # Check for existing email/username
    existing_email = await get_user_by_identifier(payload.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Propose a username from email local-part, ensure unique by suffixing numbers
    base_username = payload.email.split("@")[0]
    username = base_username
    suffix = 1
    while True:
        found = await get_user_by_identifier(username)
        if not found:
            break
        username = f"{base_username}{suffix}"
        suffix += 1

    # Hash password and create user; store real name into first_name to avoid schema change
    pw_hash = hash_password(payload.password)
    new_user = await insert_user(
        username=username,
        password_hash=pw_hash,
        email=payload.email.lower(),
        first_name=payload.real_name.strip(),
        last_name=None,
        tel=None,
    )
    if not new_user:
        raise HTTPException(status_code=500, detail="Failed to create user")

    # Set verification token and send email
    token = secrets.token_urlsafe(32)
    await set_email_verification(new_user["user_id"], token)
    try:
        send_verification_email(payload.email, token)
    except Exception:
        # Do not expose SMTP errors; user can retry later
        pass

    return {"detail": "Registration successful. Check your email to verify."}


@router.get("/auth/verify")
async def verify_email(token: Optional[str] = None):
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")
    user = await get_user_by_verification_token(token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    await mark_user_verified(user["user_id"])
    # Redirect back to frontend login with a flag
    frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(url=f"{frontend}/login?verified=1")

