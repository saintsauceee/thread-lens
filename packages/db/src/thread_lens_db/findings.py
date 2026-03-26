import json
from datetime import datetime, timezone
import asyncpg


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def append_findings(
    db: asyncpg.Connection,
    kb_id: str,
    session_id: str,
    results: list[dict],
) -> None:
    now = _now()
    await db.executemany(
        "INSERT INTO findings (kb_id, session_id, topic, findings, sources, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        [
            (kb_id, session_id, r["topic"], r["findings"], json.dumps(r.get("sources", [])), now)
            for r in results
        ],
    )


async def get_session_findings(db: asyncpg.Connection, session_id: str) -> list[dict]:
    rows = await db.fetch(
        "SELECT topic, findings, sources FROM findings WHERE session_id = $1 ORDER BY id",
        session_id,
    )
    return [
        {"topic": r["topic"], "findings": r["findings"], "sources": json.loads(r["sources"])}
        for r in rows
    ]


async def get_findings(db: asyncpg.Connection, kb_id: str) -> list[dict]:
    rows = await db.fetch(
        "SELECT topic, findings, sources FROM findings WHERE kb_id = $1 ORDER BY id",
        kb_id,
    )
    return [
        {"topic": r["topic"], "findings": r["findings"], "sources": json.loads(r["sources"])}
        for r in rows
    ]
