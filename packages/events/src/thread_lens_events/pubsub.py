import json

import redis.asyncio as redis


def _channel(session_id: str) -> str:
    return f"research:{session_id}"


async def publish_event(r: redis.Redis, session_id: str, event: dict) -> None:
    await r.publish(_channel(session_id), json.dumps(event))


async def subscribe_events(redis_url: str, session_id: str):
    """Async generator that yields parsed event dicts from a Redis pub/sub channel.

    Terminates when it receives an event with type "done", "error", or "cancelled".
    """
    r = redis.from_url(redis_url)
    pubsub = r.pubsub()
    await pubsub.subscribe(_channel(session_id))
    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            event = json.loads(message["data"])
            yield event
            if event.get("type") in ("done", "error", "cancelled"):
                break
    finally:
        await pubsub.unsubscribe(_channel(session_id))
        await pubsub.aclose()
        await r.aclose()


async def set_cancel_flag(r: redis.Redis, session_id: str) -> None:
    await r.set(f"cancel:{session_id}", "1", ex=3600)


async def is_cancelled(r: redis.Redis, session_id: str) -> bool:
    return await r.get(f"cancel:{session_id}") is not None
