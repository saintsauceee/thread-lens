import json
from datetime import datetime, timezone
import aiosqlite


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def append_findings(
    db: aiosqlite.Connection,
    kb_id: str,
    session_id: str,
    results: list[dict],
) -> None:
    now = _now()
    await db.executemany(
        "INSERT INTO findings (kb_id, session_id, topic, findings, sources, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
            (kb_id, session_id, r["topic"], r["findings"], json.dumps(r.get("sources", [])), now)
            for r in results
        ],
    )
    await db.commit()


async def get_session_findings(db: aiosqlite.Connection, session_id: str) -> list[dict]:
    async with db.execute(
        "SELECT topic, findings, sources FROM findings WHERE session_id = ? ORDER BY id",
        (session_id,),
    ) as cur:
        rows = await cur.fetchall()
    return [
        {"topic": r["topic"], "findings": r["findings"], "sources": json.loads(r["sources"])}
        for r in rows
    ]


async def get_findings(db: aiosqlite.Connection, kb_id: str) -> list[dict]:
    async with db.execute(
        "SELECT topic, findings, sources FROM findings WHERE kb_id = ? ORDER BY id",
        (kb_id,),
    ) as cur:
        rows = await cur.fetchall()
    return [
        {"topic": r["topic"], "findings": r["findings"], "sources": json.loads(r["sources"])}
        for r in rows
    ]
