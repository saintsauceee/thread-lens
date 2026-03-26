import asyncio
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse
from thread_lens_db import (
    append_findings,
    cancel_session,
    complete_session,
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
    save_agent,
    update_agent_source_count,
    update_artifact,
)

from research.agent import build_graph
from research.agent.nodes import clarify_query
from research.agent.state import SubagentResult
from research.auth import get_current_user
from research.cache import (
    get_cached_kb,
    get_cached_kb_list,
    invalidate_kb,
    invalidate_kb_list,
    set_cached_kb,
    set_cached_kb_list,
)
from research.models import ResearchRequest, ResearchResponse

router = APIRouter(prefix="/research", tags=["research"])

_graph = build_graph()
_running_tasks: dict[str, asyncio.Task] = {}

def _INITIAL_STATE(query, fast=False, clarifications=None, partial_results=None, refocus=None, kb_id=None, kb_existing_results=None, kb_existing_artifact=None, follow_up=None):
    return {
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
    if task := _running_tasks.pop(session_id, None):
        task.cancel()
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
                await invalidate_kb_list()

            # Within-session refocus: load partial results from DB
            partial_results: list[SubagentResult] = []
            if session_id and refocus:
                partial_results = await get_session_findings(db, session_id)

            # Create session record for this run
            session = await create_session(db, active_kb_id, follow_up)
            new_session_id = session["id"]

            _running_tasks[new_session_id] = asyncio.current_task()

            yield emit({"type": "kb_id", "id": active_kb_id})
            yield emit({"type": "session_id", "id": new_session_id})
            yield emit({"type": "orchestrator_phase", "phase": "thinking"})

            initial_state = _INITIAL_STATE(
                query, fast, parsed_clarifications,
                partial_results, refocus,
                active_kb_id, kb_existing_results, kb_existing_artifact, follow_up,
            )

            session_completed = False
            try:
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

                        task_topic = task.get("topic", "Researching…")
                        await save_agent(db, active_kb_id, new_session_id, agent_id, task_topic, round_num)
                        yield emit({
                            "type": "agent_spawned",
                            "id": agent_id,
                            "task": task_topic,
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

                            await update_agent_source_count(db, new_session_id, agent_id, source_count)
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
                        await complete_session(db, new_session_id, duration)
                        await invalidate_kb(active_kb_id, user["id"])
                        session_completed = True

                        yield emit({
                            "type": "artifact_ready",
                            "artifact": artifact,
                            "durationSec": duration,
                            "kbId": active_kb_id,
                        })
                        yield emit({"type": "done"})
            except GeneratorExit:
                pass
            except Exception as exc:
                yield emit({"type": "error", "message": str(exc)})
            finally:
                _running_tasks.pop(new_session_id, None)
                if not session_completed:
                    await cancel_session(db, new_session_id)

    return EventSourceResponse(generate())


@router.post("", response_model=ResearchResponse)
async def run_research(req: ResearchRequest, user: dict = Depends(get_current_user)) -> ResearchResponse:
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
