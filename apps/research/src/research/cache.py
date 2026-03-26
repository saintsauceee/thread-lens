import json
import os

from redis.asyncio import Redis

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

_redis: Redis | None = None

# Cache TTLs in seconds
KB_TTL = 60 * 10  # 10 minutes
KB_LIST_TTL = 60  # 1 minute (changes more frequently)


async def init_cache() -> None:
    global _redis
    _redis = Redis.from_url(REDIS_URL, decode_responses=True)


async def close_cache() -> None:
    global _redis
    if _redis:
        await _redis.close()
        _redis = None


def _kb_key(kb_id: str) -> str:
    return f"kb:{kb_id}"


KB_LIST_KEY = "kb:list"


async def get_cached_kb(kb_id: str) -> dict | None:
    data = await _redis.get(_kb_key(kb_id))
    return json.loads(data) if data else None


async def set_cached_kb(kb_id: str, kb: dict) -> None:
    await _redis.set(_kb_key(kb_id), json.dumps(kb, default=str), ex=KB_TTL)


async def get_cached_kb_list() -> list[dict] | None:
    data = await _redis.get(KB_LIST_KEY)
    return json.loads(data) if data else None


async def set_cached_kb_list(kbs: list[dict]) -> None:
    await _redis.set(KB_LIST_KEY, json.dumps(kbs, default=str), ex=KB_LIST_TTL)


async def invalidate_kb(kb_id: str) -> None:
    """Clear cache for a specific KB and the list."""
    await _redis.delete(_kb_key(kb_id), KB_LIST_KEY)


async def invalidate_kb_list() -> None:
    """Clear just the list cache (e.g. after creating a new KB)."""
    await _redis.delete(KB_LIST_KEY)
