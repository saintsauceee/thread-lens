import asyncio
import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from research.agent import build_graph
from research.agent.nodes import clarify_query
from research.agent.state import SubagentResult
from research.models import ResearchRequest, ResearchResponse
from thread_lens_db import (
    get_db,
    create_kb,
    get_kb,
    update_artifact,
    append_findings,
    get_findings,
    get_session_findings,
    create_session,
    complete_session,
)

router = APIRouter(prefix="/research", tags=["research"])

_graph = build_graph()

_INITIAL_STATE = lambda query, fast=False, clarifications=None, partial_results=None, refocus=None, kb_id=None, kb_existing_results=None, kb_existing_artifact=None, follow_up=None: {
    "query": query,
    "fast": fast,
    "clarifications": clarifications or [],
    "refocus": refocus or "",
    "refocus_dispatched": False,
    "kb_id": kb_id or "",
    "kb_existing_results": kb_existing_results or [],
    "kb_existing_artifact": kb_existing_artifact or "",
    "follow_up": follow_up or "",
    "tasks": [],
    "results": partial_results or [],
    "gaps": [],
    "round": 0,
}


@router.get("/clarify")
async def clarify(query: str, fast: bool = False):
    questions = await clarify_query(query, fast)
    return {"questions": questions}


@router.get("/kb/{kb_id}")
async def get_kb_endpoint(kb_id: str):
    async with get_db() as db:
        kb = await get_kb(db, kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="KB not found")
    return kb


@router.get("/stream")
async def stream_research(
    query: str,
    fast: bool = False,
    clarifications: Optional[str] = None,
    session_id: Optional[str] = None,
    refocus: Optional[str] = None,
    kb_id: Optional[str] = None,
    follow_up: Optional[str] = None,
):
    async def generate():
        agent_id_counter = 0
        agent_run_ids: dict[str, int] = {}
        tool_counters: dict[int, int] = {}
        tool_run_ids: dict[str, tuple] = {}
        start = asyncio.get_event_loop().time()

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
            kb_existing_results: list[SubagentResult] = []
            kb_existing_artifact = ""

            if is_follow_up:
                existing_kb = await get_kb(db, kb_id)
                if existing_kb:
                    kb_existing_results = await get_findings(db, kb_id)
                    kb_existing_artifact = existing_kb["artifact"]
                    active_kb_id = kb_id
                else:
                    new_kb = await create_kb(db, query)
                    active_kb_id = new_kb["id"]
            else:
                new_kb = await create_kb(db, query)
                active_kb_id = new_kb["id"]

            # Within-session refocus: load partial results from DB
            partial_results: list[SubagentResult] = []
            if session_id and refocus:
                partial_results = await get_session_findings(db, session_id)

            # Create session record for this run
            session = await create_session(db, active_kb_id, follow_up)
            new_session_id = session["id"]

            yield emit({"type": "kb_id", "id": active_kb_id})
            yield emit({"type": "session_id", "id": new_session_id})
            yield emit({"type": "orchestrator_phase", "phase": "thinking"})

            initial_state = _INITIAL_STATE(
                query, fast, parsed_clarifications,
                partial_results, refocus,
                active_kb_id, kb_existing_results, kb_existing_artifact, follow_up,
            )

            async for event in _graph.astream_events(initial_state, version="v2"):
                evt = event["event"]
                name = event["name"]
                run_id = event["run_id"]
                data = event.get("data", {})

                if evt == "on_chain_end" and name == "orchestrator" and "tasks" in data.get("output", {}):
                    yield emit({"type": "orchestrator_phase", "phase": "spawning"})

                elif evt == "on_chain_start" and name == "subagent":
                    agent_id = agent_id_counter
                    agent_id_counter += 1
                    agent_run_ids[run_id] = agent_id
                    tool_counters[agent_id] = 0

                    inp = data.get("input", {})
                    task = inp.get("current_task", {})
                    round_num = 2 if inp.get("round", 0) >= 2 else 1

                    yield emit({
                        "type": "agent_spawned",
                        "id": agent_id,
                        "task": task.get("topic", "Researching…"),
                        "round": round_num,
                    })

                elif evt == "on_tool_start":
                    parent_ids = event.get("parent_ids", [])
                    agent_id = next(
                        (agent_run_ids[pid] for pid in parent_ids if pid in agent_run_ids),
                        None,
                    )
                    if agent_id is not None:
                        tool_id = tool_counters[agent_id]
                        tool_counters[agent_id] += 1
                        tool_run_ids[run_id] = (agent_id, tool_id)

                        args = data.get("input", {})
                        label = (
                            args.get("subreddit")
                            or (f"r/{args['subreddit']}" if args.get("subreddit") else None)
                            or (args.get("query") or "")[:30]
                            or name
                        )

                        yield emit({
                            "type": "tool_call",
                            "agentId": agent_id,
                            "toolId": tool_id,
                            "label": label,
                            "status": "active",
                        })

                elif evt == "on_tool_end":
                    if run_id in tool_run_ids:
                        agent_id, tool_id = tool_run_ids[run_id]
                        yield emit({
                            "type": "tool_call",
                            "agentId": agent_id,
                            "toolId": tool_id,
                            "status": "done",
                        })

                elif evt == "on_chain_end" and name == "subagent":
                    if run_id in agent_run_ids:
                        agent_id = agent_run_ids[run_id]
                        results = data.get("output", {}).get("results", [])
                        source_count = sum(len(r.get("sources", [])) for r in results)

                        if results:
                            await append_findings(db, active_kb_id, new_session_id, results)

                        yield emit({
                            "type": "agent_done",
                            "agentId": agent_id,
                            "sourceCount": source_count,
                        })

                elif evt == "on_chain_start" and name == "orchestrator" and data.get("input", {}).get("results"):
                    inp = data.get("input", {})
                    if inp.get("refocus") and not inp.get("refocus_dispatched"):
                        yield emit({"type": "orchestrator_phase", "phase": "thinking"})
                    else:
                        yield emit({"type": "orchestrator_phase", "phase": "evaluating"})

                elif evt == "on_chain_start" and name == "synthesizer":
                    yield emit({"type": "orchestrator_phase", "phase": "synthesizing"})

                elif evt == "on_chain_end" and name == "synthesizer":
                    artifact = data.get("output", {}).get("artifact", "")
                    duration = round(asyncio.get_event_loop().time() - start, 1)

                    await update_artifact(db, active_kb_id, artifact)
                    await complete_session(db, new_session_id)

                    yield emit({
                        "type": "artifact_ready",
                        "artifact": artifact,
                        "durationSec": duration,
                        "kbId": active_kb_id,
                    })
                    yield emit({"type": "done"})

    return EventSourceResponse(generate())


@router.post("", response_model=ResearchResponse)
async def run_research(req: ResearchRequest) -> ResearchResponse:
    try:
        result = await _graph.ainvoke(_INITIAL_STATE(req.query))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    sources = list({s for r in result["results"] for s in r["sources"]})
    return ResearchResponse(
        query=req.query,
        artifact=result["artifact"],
        sources=sources,
    )
