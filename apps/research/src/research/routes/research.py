import asyncio
import json

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from research.agent import build_graph
from research.models import ResearchRequest, ResearchResponse

router = APIRouter(prefix="/research", tags=["research"])

_graph = build_graph()

_INITIAL_STATE = lambda query: {
    "query": query,
    "tasks": [],
    "results": [],
    "gaps": [],
    "round": 0,
}


@router.get("/stream")
async def stream_research(query: str):
    async def generate():
        agent_id_counter = 0
        agent_run_ids: dict[str, int] = {}   # run_id -> agent_id
        tool_counters: dict[int, int] = {}   # agent_id -> next tool_id
        tool_run_ids: dict[str, tuple] = {}  # run_id -> (agent_id, tool_id)
        start = asyncio.get_event_loop().time()

        def emit(payload: dict) -> dict:
            return {"data": json.dumps(payload)}

        yield emit({"type": "orchestrator_phase", "phase": "thinking"})

        async for event in _graph.astream_events(_INITIAL_STATE(query), version="v2"):
            evt = event["event"]
            name = event["name"]
            run_id = event["run_id"]
            data = event.get("data", {})

            if evt == "on_chain_end" and name == "orchestrator":
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
                    yield emit({
                        "type": "agent_done",
                        "agentId": agent_id,
                        "sourceCount": source_count,
                    })

            elif evt == "on_chain_start" and name == "evaluator":
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
