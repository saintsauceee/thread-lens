import uuid
from datetime import datetime, timezone
import aiosqlite


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_kb(db: aiosqlite.Connection, query: str) -> dict:
    kb_id = str(uuid.uuid4())
    now = _now()
    await db.execute(
        "INSERT INTO knowledge_bases (id, query, artifact, created_at, updated_at) VALUES (?, ?, '', ?, ?)",
        (kb_id, query, now, now),
    )
    await db.commit()
    return {"id": kb_id, "query": query, "artifact": "", "created_at": now, "updated_at": now}


async def get_kb(db: aiosqlite.Connection, kb_id: str) -> dict | None:
    async with db.execute(
        """
        SELECT kb.*,
            CASE
                WHEN kb.artifact != '' THEN 'complete'
                WHEN s.cancelled_at IS NOT NULL THEN 'cancelled'
                ELSE 'incomplete'
            END AS status
        FROM knowledge_bases kb
        LEFT JOIN sessions s ON s.id = (
            SELECT id FROM sessions WHERE kb_id = kb.id ORDER BY created_at DESC LIMIT 1
        )
        WHERE kb.id = ?
        """,
        (kb_id,),
    ) as cur:
        row = await cur.fetchone()
    return dict(row) if row else None


async def list_kbs(db: aiosqlite.Connection) -> list[dict]:
    async with db.execute(
        """
        SELECT kb.id, kb.query, kb.updated_at, substr(kb.artifact, 1, 200) AS artifact_preview,
            CASE
                WHEN kb.artifact != '' THEN 'complete'
                WHEN s.cancelled_at IS NOT NULL THEN 'cancelled'
                ELSE 'incomplete'
            END AS status
        FROM knowledge_bases kb
        LEFT JOIN sessions s ON s.id = (
            SELECT id FROM sessions WHERE kb_id = kb.id ORDER BY created_at DESC LIMIT 1
        )
        ORDER BY kb.updated_at DESC
        """
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def delete_kb(db: aiosqlite.Connection, kb_id: str) -> None:
    await db.execute("DELETE FROM knowledge_bases WHERE id = ?", (kb_id,))
    await db.commit()


async def update_artifact(db: aiosqlite.Connection, kb_id: str, artifact: str) -> None:
    await db.execute(
        "UPDATE knowledge_bases SET artifact = ?, updated_at = ? WHERE id = ?",
        (artifact, _now(), kb_id),
    )
    await db.commit()
