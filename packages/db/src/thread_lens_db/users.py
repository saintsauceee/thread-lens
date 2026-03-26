import uuid
from datetime import datetime, timezone

import asyncpg


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def create_user(db: asyncpg.Connection, email: str, password_hash: str) -> dict:
    user_id = str(uuid.uuid4())
    now = _now()
    await db.execute(
        "INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)",
        user_id, email, password_hash, now,
    )
    return {"id": user_id, "email": email, "created_at": now}


async def get_user_by_email(db: asyncpg.Connection, email: str) -> dict | None:
    row = await db.fetchrow("SELECT * FROM users WHERE email = $1", email)
    return dict(row) if row else None


async def get_user_by_id(db: asyncpg.Connection, user_id: str) -> dict | None:
    row = await db.fetchrow("SELECT id, email, created_at FROM users WHERE id = $1", user_id)
    return dict(row) if row else None
