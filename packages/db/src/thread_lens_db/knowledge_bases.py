import uuid
from datetime import datetime, timezone
import aiosqlite


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_kb(db: aiosqlite.Connection, query: str) -> dict:
    kb_id = str(uuid.uuid4())
    now = _now()
    await db.execute(
        "INSERT INTO knowledge_bases (id, query, report, created_at, updated_at) VALUES (?, ?, '', ?, ?)",
        (kb_id, query, now, now),
    )
    await db.commit()
    return {"id": kb_id, "query": query, "report": "", "created_at": now, "updated_at": now}


async def get_kb(db: aiosqlite.Connection, kb_id: str) -> dict | None:
    async with db.execute("SELECT * FROM knowledge_bases WHERE id = ?", (kb_id,)) as cur:
        row = await cur.fetchone()
    return dict(row) if row else None


async def list_kbs(db: aiosqlite.Connection) -> list[dict]:
    async with db.execute(
        "SELECT id, query, updated_at, substr(report, 1, 200) AS report_preview "
        "FROM knowledge_bases ORDER BY updated_at DESC"
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def update_report(db: aiosqlite.Connection, kb_id: str, report: str) -> None:
    await db.execute(
        "UPDATE knowledge_bases SET report = ?, updated_at = ? WHERE id = ?",
        (report, _now(), kb_id),
    )
    await db.commit()
