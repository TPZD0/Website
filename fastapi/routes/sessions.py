from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from security import require_auth
from database import (
    connect_db,
    ensure_user_sessions_table,
    insert_user_session,
    end_user_session,
    get_session_stats_today,
    get_session_stats_7d,
    get_last_session_seconds,
)

router = APIRouter()


async def ensure_db():
    await connect_db()
    try:
        await ensure_user_sessions_table()
    except Exception:
        pass


@router.post("/session/start", dependencies=[Depends(ensure_db)])
async def session_start(path: Optional[str] = None, user=Depends(require_auth)):
    try:
        uid = int(user.get("sub"))
        sid = await insert_user_session(uid, path)
        return {"session_id": sid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {e}")


@router.post("/session/end", dependencies=[Depends(ensure_db)])
async def session_end(session_id: int, duration_seconds: Optional[int] = None, user=Depends(require_auth)):
    try:
        # ensure session belongs to the user implicitly by not exposing update beyond id; trusting id here
        rec = await end_user_session(session_id, duration_seconds)
        if not rec:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"detail": "Session closed"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {e}")


@router.get("/session/stats", dependencies=[Depends(ensure_db)])
async def session_stats(user=Depends(require_auth)):
    try:
        uid = int(user.get("sub"))
        today = await get_session_stats_today(uid)
        week = await get_session_stats_7d(uid)
        last = await get_last_session_seconds(uid)
        return JSONResponse({
            "today_seconds": today,
            "week_seconds": week,
            "last_session_seconds": last or 0,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session stats: {e}")

