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

# --- User Sessions (time tracking) ------------------------------------------

async def ensure_user_sessions_table():
    await database.execute(
        """
        CREATE TABLE IF NOT EXISTS user_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
            path VARCHAR(255),
            started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP,
            duration_seconds INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    await database.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)")
    await database.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_started ON user_sessions(started_at)")
    await database.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_ended ON user_sessions(ended_at)")

async def insert_user_session(user_id: int, path: Optional[str]) -> int:
    query = """
    INSERT INTO user_sessions (user_id, path)
    VALUES (:user_id, :path)
    RETURNING id
    """
    return await database.fetch_val(query=query, values={"user_id": user_id, "path": path})

async def end_user_session(session_id: int, duration_seconds: Optional[int] = None):
    # If duration not provided, compute based on started_at and now()
    if duration_seconds is None:
        query = """
        UPDATE user_sessions
        SET ended_at = CURRENT_TIMESTAMP,
            duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INT
        WHERE id = :id
        RETURNING *
        """
        return await database.fetch_one(query=query, values={"id": session_id})
    else:
        query = """
        UPDATE user_sessions
        SET ended_at = CURRENT_TIMESTAMP,
            duration_seconds = :duration
        WHERE id = :id
        RETURNING *
        """
        return await database.fetch_one(query=query, values={"id": session_id, "duration": duration_seconds})

async def get_session_stats_today(user_id: int) -> int:
    # Sum completed sessions that ended today, plus any currently active session that started today (partial up to now)
    query = """
    SELECT COALESCE(SUM(
        CASE
            WHEN ended_at IS NOT NULL THEN COALESCE(duration_seconds, 0)
            ELSE EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INT
        END
    ), 0) AS total
    FROM user_sessions
    WHERE user_id = :user_id
      AND (
        (ended_at IS NOT NULL AND ended_at >= date_trunc('day', CURRENT_TIMESTAMP))
        OR (ended_at IS NULL AND started_at >= date_trunc('day', CURRENT_TIMESTAMP))
      )
    """
    return int(await database.fetch_val(query=query, values={"user_id": user_id}) or 0)

async def get_session_stats_7d(user_id: int) -> int:
    # Sum completed sessions ended within last 7 days, plus active sessions started within last 7 days (partial)
    query = """
    SELECT COALESCE(SUM(
        CASE
            WHEN ended_at IS NOT NULL THEN COALESCE(duration_seconds, 0)
            ELSE EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INT
        END
    ), 0) AS total
    FROM user_sessions
    WHERE user_id = :user_id
      AND (
        (ended_at IS NOT NULL AND ended_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days'))
        OR (ended_at IS NULL AND started_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days'))
      )
    """
    return int(await database.fetch_val(query=query, values={"user_id": user_id}) or 0)

async def get_last_session_seconds(user_id: int) -> Optional[int]:
    query = """
    SELECT duration_seconds
    FROM user_sessions
    WHERE user_id = :user_id AND ended_at IS NOT NULL
    ORDER BY ended_at DESC
    LIMIT 1
    """
    return await database.fetch_val(query=query, values={"user_id": user_id})
