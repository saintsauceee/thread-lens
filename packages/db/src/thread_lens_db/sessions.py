import uuid
from datetime import datetime, timezone
import aiosqlite


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_session(
    db: aiosqlite.Connection,
    kb_id: str,
    follow_up: str | None = None,
) -> dict:
    session_id = str(uuid.uuid4())
    now = _now()
    await db.execute(
        "INSERT INTO sessions (id, kb_id, follow_up, created_at) VALUES (?, ?, ?, ?)",
        (session_id, kb_id, follow_up, now),
    )
    await db.commit()
    return {"id": session_id, "kb_id": kb_id, "follow_up": follow_up, "created_at": now}


async def complete_session(db: aiosqlite.Connection, session_id: str) -> None:
    await db.execute(
        "UPDATE sessions SET completed_at = ? WHERE id = ?",
        (_now(), session_id),
    )
    await db.commit()


async def get_sessions(db: aiosqlite.Connection, kb_id: str) -> list[dict]:
    async with db.execute(
        "SELECT * FROM sessions WHERE kb_id = ? ORDER BY created_at",
        (kb_id,),
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]
