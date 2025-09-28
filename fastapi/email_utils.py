import os
import smtplib
from email.message import EmailMessage


SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "no-reply@example.com")
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")


def send_verification_email(to_email: str, token: str):
    if not SMTP_HOST:
        # In dev environments without SMTP configured, just print the link
        print(f"[DEV] Verification link for {to_email}: {BACKEND_BASE_URL}/api/auth/verify?token={token}")
        return

    verify_url = f"{BACKEND_BASE_URL}/api/auth/verify?token={token}"
    msg = EmailMessage()
    msg["Subject"] = "Verify your Study Partner account"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(
        f"""
Hi,

Please confirm your email address by clicking the link below:
{verify_url}

If you did not request this, please ignore this email.

Thanks,
Study Partner
""".strip()
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        try:
            smtp.starttls()
        except Exception:
            pass
        if SMTP_USER:
            smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(msg)

