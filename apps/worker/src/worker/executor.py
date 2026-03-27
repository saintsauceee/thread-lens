import asyncio
import logging
import os

import redis.asyncio as redis
from research_agent import build_graph
from thread_lens_db import (
    append_findings,
    cancel_session,
    complete_session,
    get_db,
    save_agent,
    update_agent_source_count,
    update_artifact,
)
from thread_lens_events import is_cancelled, publish_event

log = logging.getLogger(__name__)

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

_graph = build_graph()


def _initial_state(job: dict) -> dict:
    return {
        "query": job["query"],
        "fast": job.get("fast", False),
        "clarifications": job.get("clarifications") or [],
        "refocus": job.get("refocus") or "",
        "refocus_dispatched": False,
        "kb_id": job.get("kb_id", ""),
        "kb_existing_results": job.get("kb_existing_results") or [],
        "kb_existing_artifact": job.get("kb_existing_artifact") or "",
        "follow_up": job.get("follow_up") or "",
        "tasks": [],
        "results": job.get("partial_results") or [],
        "gaps": [],
        "round": 0,
    }


async def execute_research(job: dict) -> None:
    session_id = job["session_id"]
    kb_id = job["kb_id"]
    user_id = job["user_id"]

    r = redis.from_url(REDIS_URL)

    async def emit(event: dict) -> None:
        await publish_event(r, session_id, event)

    agent_id_counter = 0
    agent_run_ids: dict[str, int] = {}
    tool_counters: dict[int, int] = {}
    tool_run_ids: dict[str, tuple] = {}
    start = asyncio.get_event_loop().time()

    await emit({"type": "orchestrator_phase", "phase": "thinking"})

    initial_state = _initial_state(job)
    session_completed = False

    try:
        async with get_db() as db:
            async for event in _graph.astream_events(initial_state, version="v2"):
                # Check cancellation between major events
                if await is_cancelled(r, session_id):
                    log.info("Job cancelled session_id=%s", session_id)
                    await cancel_session(db, session_id)
                    await emit({"type": "cancelled"})
                    return

                evt = event["event"]
                name = event["name"]
                run_id = event["run_id"]
                data = event.get("data", {})

                if evt == "on_chain_end" and name == "orchestrator" and "tasks" in data.get("output", {}):
                    await emit({"type": "orchestrator_phase", "phase": "spawning"})

                elif evt == "on_chain_start" and name == "subagent":
                    agent_id = agent_id_counter
                    agent_id_counter += 1
                    agent_run_ids[run_id] = agent_id
                    tool_counters[agent_id] = 0

                    inp = data.get("input", {})
                    task = inp.get("current_task", {})
                    round_num = 2 if inp.get("round", 0) >= 2 else 1

                    task_topic = task.get("topic", "Researching…")
                    await save_agent(db, kb_id, session_id, agent_id, task_topic, round_num)
                    await emit({
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

                        await emit({
                            "type": "tool_call",
                            "agentId": agent_id,
                            "toolId": tool_id,
                            "label": label,
                            "status": "active",
                        })

                elif evt == "on_tool_end":
                    if run_id in tool_run_ids:
                        agent_id, tool_id = tool_run_ids[run_id]
                        await emit({
                            "type": "tool_call",
                            "agentId": agent_id,
                            "toolId": tool_id,
                            "status": "done",
                        })

                elif evt == "on_chain_end" and name == "subagent":
                    if run_id in agent_run_ids:
                        agent_id = agent_run_ids[run_id]
                        results = data.get("output", {}).get("results", [])
                        source_count = sum(len(r_.get("sources", [])) for r_ in results)

                        if results:
                            await append_findings(db, kb_id, session_id, results)

                        await update_agent_source_count(db, session_id, agent_id, source_count)
                        await emit({
                            "type": "agent_done",
                            "agentId": agent_id,
                            "sourceCount": source_count,
                        })

                elif evt == "on_chain_start" and name == "orchestrator" and data.get("input", {}).get("results"):
                    inp = data.get("input", {})
                    if inp.get("refocus") and not inp.get("refocus_dispatched"):
                        await emit({"type": "orchestrator_phase", "phase": "thinking"})
                    else:
                        await emit({"type": "orchestrator_phase", "phase": "evaluating"})

                elif evt == "on_chain_start" and name == "synthesizer":
                    await emit({"type": "orchestrator_phase", "phase": "synthesizing"})

                elif evt == "on_chain_end" and name == "synthesizer":
                    artifact = data.get("output", {}).get("artifact", "")
                    duration = round(asyncio.get_event_loop().time() - start, 1)

                    await update_artifact(db, kb_id, artifact)
                    await complete_session(db, session_id, duration)
                    session_completed = True

                    await emit({
                        "type": "artifact_ready",
                        "artifact": artifact,
                        "durationSec": duration,
                        "kbId": kb_id,
                    })
                    await emit({"type": "done"})

    except Exception as exc:
        log.exception("Error in research execution session_id=%s", session_id)
        await emit({"type": "error", "message": str(exc)})
    finally:
        if not session_completed:
            try:
                async with get_db() as db:
                    await cancel_session(db, session_id)
            except Exception:
                log.exception("Failed to cancel session session_id=%s", session_id)
        await r.aclose()
