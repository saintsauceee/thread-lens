import uuid
from datetime import datetime, timezone

import asyncpg


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def create_kb(db: asyncpg.Connection, query: str, user_id: str) -> dict:
    kb_id = str(uuid.uuid4())
    now = _now()
    await db.execute(
        "INSERT INTO knowledge_bases (id, query, artifact, created_at, updated_at, user_id) VALUES ($1, $2, '', $3, $4, $5)",
        kb_id, query, now, now, user_id,
    )
    return {"id": kb_id, "query": query, "artifact": "", "created_at": now, "updated_at": now}


async def get_kb(db: asyncpg.Connection, kb_id: str, user_id: str) -> dict | None:
    row = await db.fetchrow(
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
        WHERE kb.id = $1 AND kb.user_id = $2
        """,
        kb_id, user_id,
    )
    return dict(row) if row else None


async def list_kbs(db: asyncpg.Connection, user_id: str) -> list[dict]:
    rows = await db.fetch(
        """
        SELECT kb.id, kb.query, kb.updated_at, left(kb.artifact, 200) AS artifact_preview,
            CASE
                WHEN kb.artifact != '' THEN 'complete'
                WHEN s.cancelled_at IS NOT NULL THEN 'cancelled'
                ELSE 'incomplete'
            END AS status
        FROM knowledge_bases kb
        LEFT JOIN sessions s ON s.id = (
            SELECT id FROM sessions WHERE kb_id = kb.id ORDER BY created_at DESC LIMIT 1
        )
        WHERE kb.user_id = $1
        ORDER BY kb.updated_at DESC
        """,
        user_id,
    )
    return [dict(r) for r in rows]


async def delete_kb(db: asyncpg.Connection, kb_id: str, user_id: str) -> None:
    await db.execute("DELETE FROM knowledge_bases WHERE id = $1 AND user_id = $2", kb_id, user_id)


async def update_artifact(db: asyncpg.Connection, kb_id: str, artifact: str) -> None:
    await db.execute(
        "UPDATE knowledge_bases SET artifact = $1, updated_at = $2 WHERE id = $3",
        artifact, _now(), kb_id,
    )
