import uuid
from datetime import datetime, timezone
import asyncpg


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def create_session(
    db: asyncpg.Connection,
    kb_id: str,
    follow_up: str | None = None,
) -> dict:
    session_id = str(uuid.uuid4())
    now = _now()
    await db.execute(
        "INSERT INTO sessions (id, kb_id, follow_up, created_at) VALUES ($1, $2, $3, $4)",
        session_id, kb_id, follow_up, now,
    )
    return {"id": session_id, "kb_id": kb_id, "follow_up": follow_up, "created_at": now}


async def complete_session(db: asyncpg.Connection, session_id: str, duration_sec: float | None = None) -> None:
    await db.execute(
        "UPDATE sessions SET completed_at = $1, duration_sec = $2 WHERE id = $3",
        _now(), duration_sec, session_id,
    )


async def cancel_session(db: asyncpg.Connection, session_id: str) -> None:
    await db.execute(
        "UPDATE sessions SET cancelled_at = $1 WHERE id = $2",
        _now(), session_id,
    )


async def get_sessions(db: asyncpg.Connection, kb_id: str) -> list[dict]:
    rows = await db.fetch(
        "SELECT * FROM sessions WHERE kb_id = $1 ORDER BY created_at",
        kb_id,
    )
    return [dict(r) for r in rows]


async def get_latest_session_duration(db: asyncpg.Connection, kb_id: str) -> float | None:
    row = await db.fetchrow(
        "SELECT duration_sec FROM sessions WHERE kb_id = $1 AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 1",
        kb_id,
    )
    return row["duration_sec"] if row else None
