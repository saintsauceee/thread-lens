from datetime import datetime, timezone

import asyncpg


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def save_agent(
    db: asyncpg.Connection,
    kb_id: str,
    session_id: str,
    agent_index: int,
    task: str,
    round_num: int,
) -> None:
    await db.execute(
        "INSERT INTO agents (kb_id, session_id, agent_index, task, round, source_count, created_at) VALUES ($1, $2, $3, $4, $5, NULL, $6)",
        kb_id, session_id, agent_index, task, round_num, _now(),
    )


async def update_agent_source_count(
    db: asyncpg.Connection,
    session_id: str,
    agent_index: int,
    source_count: int,
) -> None:
    await db.execute(
        "UPDATE agents SET source_count = $1 WHERE session_id = $2 AND agent_index = $3",
        source_count, session_id, agent_index,
    )


async def get_kb_agents(db: asyncpg.Connection, kb_id: str) -> list[dict]:
    rows = await db.fetch(
        "SELECT agent_index, task, round, source_count, session_id FROM agents WHERE kb_id = $1 ORDER BY session_id, agent_index",
        kb_id,
    )
    return [dict(r) for r in rows]
