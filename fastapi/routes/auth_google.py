import os
import secrets
import urllib.parse
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse

from database import (
    connect_db,
    get_user,
    get_user_by_identifier,
    insert_user,
)
from security import create_session_token, require_auth

router = APIRouter()


GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def _env(name: str, default: Optional[str] = None) -> str:
    val = os.getenv(name, default)
    if val is None:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return val


def _build_redirect_uri() -> str:
    # Allow override via env; default to localhost FastAPI
    return os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/api/auth/google/callback",
    )


def _frontend_login_redirect(params: dict) -> str:
    frontend_base = os.getenv("FRONTEND_URL", "http://localhost:3000")
    qs = urllib.parse.urlencode(params, doseq=False, safe="@._-")
    return f"{frontend_base}/login?{qs}"


@router.get("/auth/google/login")
async def google_login():
    client_id = _env("GOOGLE_CLIENT_ID", "")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google client ID not configured")

    redirect_uri = _build_redirect_uri()
    scope = "openid email profile"
    state = secrets.token_urlsafe(16)

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": scope,
        "access_type": "online",
        "include_granted_scopes": "true",
        "prompt": "consent",
        "state": state,
    }

    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.get("/auth/google/login_url")
async def google_login_url():
    """Return the exact Google authorization URL we would redirect to."""
    client_id = _env("GOOGLE_CLIENT_ID", "")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google client ID not configured")

    redirect_uri = _build_redirect_uri()
    scope = "openid email profile"
    state = "debug"
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": scope,
        "access_type": "online",
        "include_granted_scopes": "true",
        "prompt": "consent",
        "state": state,
    }
    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return {"auth_url": url}


@router.get("/auth/google/debug")
async def google_debug():
    """Expose current OAuth config (masked) to verify env loading."""
    redirect_uri = _build_redirect_uri()
    cid = os.getenv("GOOGLE_CLIENT_ID", "")
    csec = os.getenv("GOOGLE_CLIENT_SECRET", "")
    fid = os.getenv("FRONTEND_URL", "")
    def _mask(s: str) -> str:
        if not s:
            return ""
        if len(s) <= 8:
            return "*" * len(s)
        return s[:4] + "*" * (len(s) - 8) + s[-4:]
    return {
        "redirect_uri": redirect_uri,
        "google_client_id_masked": _mask(cid),
        "google_client_secret_present": bool(csec),
        "frontend_url": fid,
    }


@router.get("/auth/google/callback")
async def google_callback(code: Optional[str] = None, state: Optional[str] = None):
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    client_id = _env("GOOGLE_CLIENT_ID", "")
    client_secret = _env("GOOGLE_CLIENT_SECRET", "")
    redirect_uri = _build_redirect_uri()

    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to exchange code for token")

        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=401, detail="No access token returned")

        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to retrieve Google user info")

        info = userinfo_resp.json()

    email = info.get("email")
    given_name = info.get("given_name") or info.get("name", "").split(" ")[0] if info.get("name") else None
    family_name = info.get("family_name") or (info.get("name", "").split(" ")[1] if info.get("name") and len(info.get("name").split(" ")) > 1 else None)

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # Ensure DB connection
    await connect_db()

    # If user exists by email/username, use it; else create a new one
    existing = await get_user_by_identifier(email)
    if existing:
        user = existing
    else:
        # Propose a username from email local-part
        base_username = email.split("@")[0]
        username = base_username
        # Ensure username uniqueness
        suffix = 1
        while True:
            found = await get_user(username)
            if not found:
                break
            # If the username belongs to the same email, reuse
            if found["email"] == email:
                break
            username = f"{base_username}{suffix}"
            suffix += 1

        # Store a sentinel password hash since column is NOT NULL
        # This value is never used for Google-authenticated users
        sentinel_password_hash = "GOOGLE_OAUTH_USER"

        user = await insert_user(
            username=username,
            password_hash=sentinel_password_hash,
            email=email,
            first_name=given_name,
            last_name=family_name,
            tel=None,
        )
        if not user:
            raise HTTPException(status_code=500, detail="Failed to create user")

    # Redirect to frontend with the user info so the client can store it
    user_dict = dict(user)
    redirect_url = _frontend_login_redirect(
        {
            "google": "1",
            "user_id": str(user_dict.get("user_id")),
            "username": user_dict.get("username"),
            "email": user_dict.get("email"),
            "first_name": user_dict.get("first_name") or "",
            "last_name": user_dict.get("last_name") or "",
        }
    )
    # Issue HttpOnly session cookie
    token = create_session_token(user_dict)
    resp = RedirectResponse(redirect_url)
    # For localhost, secure=False; set to True behind HTTPS
    resp.set_cookie(
        key="sp_session",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/",
    )
    return resp


@router.get("/auth/me")
async def auth_me(user=Depends(require_auth)):
    return {
        "user_id": user.get("sub"),
        "username": user.get("username"),
        "email": user.get("email"),
    }


@router.post("/auth/logout")
async def auth_logout():
    resp = RedirectResponse(_env("FRONTEND_URL", "http://localhost:3000") + "/login")
    resp.delete_cookie("sp_session", path="/")
    return resp
