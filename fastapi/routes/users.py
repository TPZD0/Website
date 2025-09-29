from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from auth import hash_password, verify_password
from security import create_session_token
from database import (
    connect_db, disconnect_db,
    insert_user, get_user, get_user_by_id,
    get_user_by_email, update_user as update_user_db,
    delete_user as delete_user_db,
    get_user_by_identifier_and_password,   # <-- import the new helper
    get_user_by_identifier,
)

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    password: str  # plain text password for registration
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    tel: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    password_hash: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    tel: Optional[str] = None

class User(BaseModel):
    user_id: int
    username: str
    password_hash: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    tel: Optional[str] = None
    created_at: datetime

# NEW: login payload supports username OR email via `identifier`
class UserLogin(BaseModel):
    identifier: str     # username OR email
    password: str       # plain text password

async def ensure_db():
    await connect_db()

@router.on_event("startup")
async def _startup():
    await connect_db()

@router.on_event("shutdown")
async def _shutdown():
    await disconnect_db()

@router.post("/users/create", response_model=User, dependencies=[Depends(ensure_db)])
async def create_user(user: UserCreate):
    # Check if username already exists
    existing_user = await get_user(user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email already exists
    existing_email = await get_user_by_identifier(user.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Hash the password
    password_hash = hash_password(user.password)
    
    result = await insert_user(
        user.username, password_hash, user.email,
        user.first_name, user.last_name, user.tel
    )
    if result is None:
        raise HTTPException(status_code=400, detail="Error creating user")
    return result

@router.get("/users/{user_id}", response_model=User, dependencies=[Depends(ensure_db)])
async def read_user(user_id: int):
    result = await get_user_by_id(user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return result

@router.put("/users/{user_id}", response_model=User, dependencies=[Depends(ensure_db)])
async def update_user_endpoint(user_id: int, user: UserUpdate):
    current = await get_user_by_id(user_id)
    if current is None:
        raise HTTPException(status_code=404, detail="User not found")
    username = user.username if user.username is not None else current["username"]
    password_hash = user.password_hash if user.password_hash is not None else current["password_hash"]
    email = user.email if user.email is not None else current["email"]
    first_name = user.first_name if user.first_name is not None else current["first_name"]
    last_name = user.last_name if user.last_name is not None else current["last_name"]
    tel = user.tel if user.tel is not None else current["tel"]
    result = await update_user_db(user_id, username, password_hash, email, first_name, last_name, tel)
    return result

@router.delete("/users/{user_id}", dependencies=[Depends(ensure_db)])
async def delete_user_endpoint(user_id: int):
    result = await delete_user_db(user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted"}

# UPDATED: login supports username OR email via `identifier`
@router.post("/users/login", dependencies=[Depends(ensure_db)])
async def login_user(payload: UserLogin):
    # Get user by identifier (username or email)
    db_user = await get_user_by_identifier(payload.identifier)
    if db_user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(payload.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Enforce email verification if present in schema
    user_dict = dict(db_user)
    if "is_verified" in user_dict and not user_dict.get("is_verified"):
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")
    
    # Create session token and set HttpOnly cookie so Next.js middleware can verify
    token = create_session_token(user_dict)
    body = {
        "user_id": user_dict["user_id"],
        "username": user_dict["username"],
        "email": user_dict["email"],
        "first_name": user_dict.get("first_name"),
        "last_name": user_dict.get("last_name"),
        "tel": user_dict.get("tel"),
        "created_at": user_dict.get("created_at"),
    }
    # Ensure JSON-safe encoding for datetime fields
    resp = JSONResponse(content=jsonable_encoder(body))
    # For local dev, secure=False; enable secure=True behind HTTPS
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
