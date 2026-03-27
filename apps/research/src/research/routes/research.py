import json
import os
from typing import Optional

import aio_pika
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse
from thread_lens_db import (
    cancel_session,
    create_kb,
    create_session,
    delete_kb,
    get_db,
    get_findings,
    get_kb,
    get_kb_agents,
    get_latest_session_duration,
    get_session_findings,
    list_kbs,
)
from thread_lens_events import set_cancel_flag, subscribe_events

from research.agent.nodes import clarify_query
from research.auth import get_current_user
from research.cache import (
    get_cached_kb,
    get_cached_kb_list,
    invalidate_kb,
    invalidate_kb_list,
    set_cached_kb,
    set_cached_kb_list,
)
from research.queue import get_rmq_channel

router = APIRouter(prefix="/research", tags=["research"])

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
QUEUE_NAME = "research_jobs"


@router.get("/clarify")
async def clarify(query: str, fast: bool = False, user: dict = Depends(get_current_user)):
    questions = await clarify_query(query, fast)
    return {"questions": questions}


@router.get("/kbs")
async def list_kbs_endpoint(user: dict = Depends(get_current_user)):
    cached = await get_cached_kb_list(user["id"])
    if cached is not None:
        return cached
    async with get_db() as db:
        kbs = await list_kbs(db, user["id"])
    await set_cached_kb_list(user["id"], kbs)
    return kbs


@router.post("/session/{session_id}/cancel")
async def cancel_session_endpoint(session_id: str, user: dict = Depends(get_current_user)):
    r = aioredis.from_url(REDIS_URL)
    try:
        await set_cancel_flag(r, session_id)
    finally:
        await r.aclose()
    async with get_db() as db:
        await cancel_session(db, session_id)
    return {"ok": True}


@router.delete("/kb/{kb_id}")
async def delete_kb_endpoint(kb_id: str, user: dict = Depends(get_current_user)):
    async with get_db() as db:
        await delete_kb(db, kb_id, user["id"])
    await invalidate_kb(kb_id, user["id"])
    return {"ok": True}


@router.get("/kb/{kb_id}")
async def get_kb_endpoint(kb_id: str, user: dict = Depends(get_current_user)):
    cached = await get_cached_kb(kb_id)
    if cached is not None:
        return cached
    async with get_db() as db:
        kb = await get_kb(db, kb_id, user["id"])
    if not kb:
        raise HTTPException(status_code=404, detail="KB not found")
    await set_cached_kb(kb_id, kb)
    return kb


@router.get("/kb/{kb_id}/agents")
async def get_kb_agents_endpoint(kb_id: str, user: dict = Depends(get_current_user)):
    async with get_db() as db:
        kb = await get_kb(db, kb_id, user["id"])
        if not kb:
            raise HTTPException(status_code=404, detail="KB not found")
        raw_agents = await get_kb_agents(db, kb_id)
        duration_sec = await get_latest_session_duration(db, kb_id)

    agents = [
        {
            "id": a["agent_index"],
            "task": a["task"],
            "round": a["round"],
            "sourceCount": a["source_count"],
            "status": "done",
        }
        for a in raw_agents
    ]
    total_sources = sum(a["sourceCount"] or 0 for a in agents)
    return {
        "agents": agents,
        "agentCount": len(agents),
        "sourceCount": total_sources,
        "durationSec": duration_sec,
    }


@router.get("/kb/{kb_id}/export")
async def export_kb_endpoint(kb_id: str, user: dict = Depends(get_current_user)):
    async with get_db() as db:
        kb = await get_kb(db, kb_id, user["id"])
        if not kb:
            raise HTTPException(status_code=404, detail="KB not found")
        findings = await get_findings(db, kb_id)
    sources = list({s for f in findings for s in f.get("sources", [])})
    return {
        "query": kb["query"],
        "artifact": kb["artifact"],
        "sources": sources,
        "created_at": kb["created_at"],
        "updated_at": kb["updated_at"],
    }


@router.get("/stream")
async def stream_research(
    query: str,
    fast: bool = False,
    clarifications: Optional[str] = None,
    session_id: Optional[str] = None,
    refocus: Optional[str] = None,
    kb_id: Optional[str] = None,
    follow_up: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    async def generate():
        parsed_clarifications = None
        if clarifications:
            try:
                parsed_clarifications = json.loads(clarifications)
            except (json.JSONDecodeError, ValueError):
                pass

        def emit(payload: dict) -> dict:
            return {"data": json.dumps(payload)}

        async with get_db() as db:
            # Resolve KB: load existing or create new
            is_follow_up = bool(kb_id and follow_up)
            kb_existing_results = []
            kb_existing_artifact = ""

            if is_follow_up:
                existing_kb = await get_kb(db, kb_id, user["id"])
                if existing_kb:
                    kb_existing_results = await get_findings(db, kb_id)
                    kb_existing_artifact = existing_kb["artifact"]
                    active_kb_id = kb_id
                else:
                    new_kb = await create_kb(db, query, user["id"])
                    active_kb_id = new_kb["id"]
                    await invalidate_kb_list(user["id"])
            else:
                new_kb = await create_kb(db, query, user["id"])
                active_kb_id = new_kb["id"]
                await invalidate_kb_list(user["id"])

            # Within-session refocus: load partial results from DB
            partial_results = []
            if session_id and refocus:
                partial_results = await get_session_findings(db, session_id)

            # Create session record for this run
            session = await create_session(db, active_kb_id, follow_up)
            new_session_id = session["id"]

        # Emit IDs immediately — the client needs these before the worker starts
        yield emit({"type": "kb_id", "id": active_kb_id})
        yield emit({"type": "session_id", "id": new_session_id})

        # Publish job to RabbitMQ
        job = {
            "session_id": new_session_id,
            "kb_id": active_kb_id,
            "user_id": user["id"],
            "query": query,
            "fast": fast,
            "clarifications": parsed_clarifications,
            "refocus": refocus,
            "follow_up": follow_up,
            "kb_existing_results": kb_existing_results,
            "kb_existing_artifact": kb_existing_artifact,
            "partial_results": partial_results,
        }

        channel = get_rmq_channel()
        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(job, default=str).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key=QUEUE_NAME,
        )

        # Subscribe to Redis pub/sub and relay worker events as SSE
        try:
            async for event in subscribe_events(REDIS_URL, new_session_id):
                yield emit(event)

                # Invalidate cache when research completes
                if event.get("type") == "done":
                    await invalidate_kb(active_kb_id, user["id"])
        except GeneratorExit:
            pass

    return EventSourceResponse(generate())
