from datetime import datetime, timezone
import aiosqlite


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def save_agent(
    db: aiosqlite.Connection,
    kb_id: str,
    session_id: str,
    agent_index: int,
    task: str,
    round_num: int,
) -> None:
    await db.execute(
        "INSERT INTO agents (kb_id, session_id, agent_index, task, round, source_count, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)",
        (kb_id, session_id, agent_index, task, round_num, _now()),
    )
    await db.commit()


async def update_agent_source_count(
    db: aiosqlite.Connection,
    session_id: str,
    agent_index: int,
    source_count: int,
) -> None:
    await db.execute(
        "UPDATE agents SET source_count = ? WHERE session_id = ? AND agent_index = ?",
        (source_count, session_id, agent_index),
    )
    await db.commit()


async def get_kb_agents(db: aiosqlite.Connection, kb_id: str) -> list[dict]:
    async with db.execute(
        "SELECT agent_index, task, round, source_count, session_id FROM agents WHERE kb_id = ? ORDER BY session_id, agent_index",
        (kb_id,),
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]
