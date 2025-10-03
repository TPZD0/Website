from passlib.context import CryptContext

# Password hashing context
# Use bcrypt_sha256 to avoid bcrypt's 72-byte password limit while
# still supporting verification of existing bcrypt hashes.
pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """Hash a password (bcrypt_sha256 by default)."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)
