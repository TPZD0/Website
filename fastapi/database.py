from typing import Optional
from databases import Database

POSTGRES_USER = "temp"
POSTGRES_PASSWORD = "temp"
POSTGRES_DB = "advcompro"
POSTGRES_HOST = "db"

DATABASE_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}/{POSTGRES_DB}"

database = Database(DATABASE_URL)

# --- lifecycle ---------------------------------------------------------------

async def connect_db():
    if not database.is_connected:
        await database.connect()

async def disconnect_db():
    if database.is_connected:
        await database.disconnect()

# --- CRUD: users -------------------------------------------------------------

async def insert_user(
    username: str,
    password_hash: str,
    email: str,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    tel: Optional[str] = None,
):
    query = """
    INSERT INTO users (username, password_hash, email, first_name, last_name, tel)
    VALUES (:username, :password_hash, :email, :first_name, :last_name, :tel)
    RETURNING user_id, username, password_hash, email, first_name, last_name, tel, created_at
    """
    values = {
        "username": username,
        "password_hash": password_hash,
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "tel": tel,
    }
    return await database.fetch_one(query=query, values=values)

async def get_user_by_id(user_id: int):
    query = "SELECT * FROM users WHERE user_id = :user_id"
    return await database.fetch_one(query=query, values={"user_id": user_id})

async def get_user(username: str):
    query = "SELECT * FROM users WHERE username = :username"
    return await database.fetch_one(query=query, values={"username": username})

async def get_user_by_email(email: str, password_hash: str):
    query = "SELECT * FROM users WHERE email = :email AND password_hash = :password_hash"
    return await database.fetch_one(query=query, values={"email": email, "password_hash": password_hash})

# NEW: login by username OR email through a single identifier
async def get_user_by_identifier_and_password(identifier: str, password_hash: str):
    query = """
    SELECT * FROM users
    WHERE (username = :identifier OR email = :identifier)
      AND password_hash = :password_hash
    """
    return await database.fetch_one(query=query, values={"identifier": identifier, "password_hash": password_hash})

# Get user by identifier (username or email) for authentication
async def get_user_by_identifier(identifier: str):
    query = """
    SELECT * FROM users
    WHERE username = :identifier OR email = :identifier
    """
    return await database.fetch_one(query=query, values={"identifier": identifier})

# --- Email verification helpers --------------------------------------------

async def set_email_verification(user_id: int, token: str):
    query = """
    UPDATE users
    SET verification_token = :token,
        verification_sent_at = CURRENT_TIMESTAMP,
        is_verified = FALSE
    WHERE user_id = :user_id
    RETURNING *
    """
    return await database.fetch_one(query=query, values={"user_id": user_id, "token": token})

async def get_user_by_verification_token(token: str):
    query = "SELECT * FROM users WHERE verification_token = :token"
    return await database.fetch_one(query=query, values={"token": token})

async def mark_user_verified(user_id: int):
    query = """
    UPDATE users
    SET is_verified = TRUE,
        verification_token = NULL,
        verification_sent_at = NULL
    WHERE user_id = :user_id
    RETURNING *
    """
    return await database.fetch_one(query=query, values={"user_id": user_id})

# --- Password reset helpers --------------------------------------------------

async def ensure_reset_columns():
    """Ensure the users table has reset_token/reset_sent_at columns."""
    # Using IF NOT EXISTS makes this safe to run on every startup
    await database.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)"
    )
    await database.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_sent_at TIMESTAMP"
    )

async def set_password_reset(user_id: int, token: str):
    query = """
    UPDATE users
    SET reset_token = :token,
        reset_sent_at = CURRENT_TIMESTAMP
    WHERE user_id = :user_id
    RETURNING *
    """
    return await database.fetch_one(query=query, values={"user_id": user_id, "token": token})

async def get_user_by_reset_token(token: str):
    query = "SELECT * FROM users WHERE reset_token = :token"
    return await database.fetch_one(query=query, values={"token": token})

async def clear_password_reset(user_id: int):
    query = """
    UPDATE users
    SET reset_token = NULL,
        reset_sent_at = NULL
    WHERE user_id = :user_id
    RETURNING *
    """
    return await database.fetch_one(query=query, values={"user_id": user_id})

async def update_user_password(user_id: int, password_hash: str):
    query = """
    UPDATE users
    SET password_hash = :password_hash
    WHERE user_id = :user_id
    RETURNING *
    """
    return await database.fetch_one(query=query, values={"user_id": user_id, "password_hash": password_hash})

async def insert_pdf(user_id: int, name: str, file_path: str):
    query = """
    INSERT INTO pdf_files (user_id, name, file_path)
    VALUES (:user_id, :name, :file_path)
    RETURNING id, user_id, name, file_path, uploaded_at
    """
    values = {"user_id": user_id, "name": name, "file_path": file_path}
    return await database.fetch_one(query=query, values=values)

async def get_recent_pdfs(user_id: int, limit: int = 10):
    query = """
    SELECT id, name, file_path, uploaded_at
    FROM pdf_files
    WHERE user_id = :user_id
    ORDER BY uploaded_at DESC
    LIMIT :limit
    """
    return await database.fetch_all(query=query, values={"user_id": user_id, "limit": limit})


async def update_user(
    user_id: int,
    username: str,
    password_hash: str,
    email: str,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    tel: Optional[str] = None,
):
    query = """
    UPDATE users
    SET username = :username,
        password_hash = :password_hash,
        email = :email,
        first_name = :first_name,
        last_name = :last_name,
        tel = :tel
    WHERE user_id = :user_id
    RETURNING user_id, username, password_hash, email, first_name, last_name, tel, created_at
    """
    values = {
        "user_id": user_id,
        "username": username,
        "password_hash": password_hash,
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "tel": tel,
    }
    return await database.fetch_one(query=query, values=values)

async def delete_user(user_id: int):
    query = "DELETE FROM users WHERE user_id = :user_id RETURNING *"
    return await database.fetch_one(query=query, values={"user_id": user_id})
