import os
import time
from typing import Dict, Any

import jwt
from fastapi import HTTPException, Request


def _get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        # Safe default for local dev; set your own in .env in real deployments
        secret = "dev-secret-change-me"
    return secret


def create_session_token(user: Dict[str, Any], ttl_seconds: int = 7 * 24 * 3600) -> str:
    now = int(time.time())
    payload = {
        "sub": str(user["user_id"]),
        "username": user["username"],
        "email": user["email"],
        "iat": now,
        "exp": now + ttl_seconds,
    }
    token = jwt.encode(payload, _get_jwt_secret(), algorithm="HS256")
    return token


def verify_session_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, _get_jwt_secret(), algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")


async def require_auth(request: Request) -> Dict[str, Any]:
    token = request.cookies.get("sp_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_session_token(token)
    # Attach for handlers that want to use it
    request.state.user = payload
    return payload

