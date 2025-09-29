# main.py
import os
from urllib.parse import urlparse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import connect_db, disconnect_db, ensure_reset_columns
from routes.files import router as files_router
from routes.users import router as users_router
from routes.ai import router as ai_router
from routes.goals import router as goals_router
from routes.auth_google import router as google_auth_router
from routes.auth_email import router as email_auth_router
from routes.sessions import router as sessions_router

app = FastAPI()

# Configure CORS to allow cookie-based auth from the frontend origin
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
parsed = urlparse(frontend_url)
frontend_origin = f"{parsed.scheme}://{parsed.hostname}"
if parsed.port:
    frontend_origin += f":{parsed.port}"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
async def startup():
    await connect_db()
    # Ensure optional schema bits needed by features like password reset
    try:
        await ensure_reset_columns()
    except Exception:
        # Don't crash app if migration fails; log would show in server
        pass

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()

app.include_router(files_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(goals_router, prefix="/api")
app.include_router(google_auth_router, prefix="/api")
app.include_router(email_auth_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
