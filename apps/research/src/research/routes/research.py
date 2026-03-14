import asyncio
import json
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from research.agent import build_graph
from research.agent.nodes import clarify_query
from research.models import ResearchRequest, ResearchResponse

router = APIRouter(prefix="/research", tags=["research"])

_graph = build_graph()

# In-memory session store: session_id -> accumulated SubagentResults
_sessions: dict[str, list] = {}

_INITIAL_STATE = lambda query, fast=False, clarifications=None, partial_results=None, refocus=None: {
    "query": query,
    "fast": fast,
    "clarifications": clarifications or [],
    "refocus": refocus or "",
    "refocus_dispatched": False,
    "tasks": [],
    "results": partial_results or [],
    "gaps": [],
    "round": 0,
}


@router.get("/clarify")
async def clarify(query: str, fast: bool = False):
    questions = await clarify_query(query, fast)
    return {"questions": questions}


@router.get("/stream")
async def stream_research(
    query: str,
    fast: bool = False,
    clarifications: Optional[str] = None,
    session_id: Optional[str] = None,
    refocus: Optional[str] = None,
):
    async def generate():
        agent_id_counter = 0
        agent_run_ids: dict[str, int] = {}   # run_id -> agent_id
        tool_counters: dict[int, int] = {}   # agent_id -> next tool_id
        tool_run_ids: dict[str, tuple] = {}  # run_id -> (agent_id, tool_id)
        start = asyncio.get_event_loop().time()

        parsed_clarifications = None
        if clarifications:
            try:
                parsed_clarifications = json.loads(clarifications)
            except (json.JSONDecodeError, ValueError):
                pass

        # Load partial results from a prior session if refocusing
        partial_results = _sessions.get(session_id, []) if session_id and refocus else []

        # Create a new session to accumulate results from this run
        new_session_id = str(uuid.uuid4())
        _sessions[new_session_id] = list(partial_results)

        def emit(payload: dict) -> dict:
            return {"data": json.dumps(payload)}

        yield emit({"type": "session_id", "id": new_session_id})
        yield emit({"type": "orchestrator_phase", "phase": "thinking"})

        initial_state = _INITIAL_STATE(query, fast, parsed_clarifications, partial_results, refocus)

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
                    # Accumulate results into session for potential future refocus
                    _sessions[new_session_id].extend(results)
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
                report = data.get("output", {}).get("report", "")
                duration = round(asyncio.get_event_loop().time() - start, 1)
                yield emit({
                    "type": "report_ready",
                    "report": report,
                    "durationSec": duration,
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
        report=result["report"],
        sources=sources,
    )
