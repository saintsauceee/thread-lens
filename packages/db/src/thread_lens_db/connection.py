import os
import asyncpg
from contextlib import asynccontextmanager
from typing import AsyncIterator

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/thread_lens"
)

_pool: asyncpg.Pool | None = None

_SCHEMA = """
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    artifact TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS findings (
    id BIGSERIAL PRIMARY KEY,
    kb_id TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    findings TEXT NOT NULL,
    sources TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    kb_id TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    follow_up TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    duration_sec DOUBLE PRECISION
);
CREATE TABLE IF NOT EXISTS agents (
    id BIGSERIAL PRIMARY KEY,
    kb_id TEXT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    agent_index INTEGER NOT NULL,
    task TEXT NOT NULL,
    round INTEGER NOT NULL,
    source_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS findings_kb_id ON findings(kb_id);
CREATE INDEX IF NOT EXISTS sessions_kb_id ON sessions(kb_id);
CREATE INDEX IF NOT EXISTS agents_kb_id ON agents(kb_id);
"""


async def init_db() -> None:
    global _pool
    _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    async with _pool.acquire() as conn:
        await conn.execute(_SCHEMA)


async def close_db() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_db() -> AsyncIterator[asyncpg.Connection]:
    async with _pool.acquire() as conn:
        yield conn
