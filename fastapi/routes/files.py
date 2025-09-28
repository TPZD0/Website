# routes/files.py
from fastapi import APIRouter, UploadFile, Form, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
import os, uuid, shutil
from datetime import datetime
from database import insert_pdf, get_recent_pdfs

from security import require_auth

router = APIRouter(dependencies=[Depends(require_auth)])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/files/upload")
async def upload_file(
    user_id: int = Form(...),
    name: str = Form(...),
    file: UploadFile | None = None
):
    if file is None:
        raise HTTPException(status_code=400, detail="No file uploaded")
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # unique filename
    unique_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex}.pdf"
    save_path = os.path.join(UPLOAD_DIR, unique_name)

    # write file to disk
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # store record in DB
    record = await insert_pdf(user_id, name, save_path)

    return JSONResponse({
        "id": record["id"],
        "user_id": record["user_id"],
        "name": record["name"],
        "file_path": record["file_path"],
        "uploaded_at": record["uploaded_at"].isoformat(),
    })


@router.get("/files/recent/{user_id}")
async def recent_files(user_id: int, limit: int = 10):
    rows = await get_recent_pdfs(user_id, limit)
    # serialize datetimes
    return [
        {
            **dict(r),
            "uploaded_at": r["uploaded_at"].isoformat() if hasattr(r["uploaded_at"], "isoformat") else r["uploaded_at"]
        }
        for r in rows
    ]
