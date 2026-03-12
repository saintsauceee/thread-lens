from fastapi import APIRouter, HTTPException

from research.agent import build_graph
from research.models import ResearchRequest, ResearchResponse

router = APIRouter(prefix="/research", tags=["research"])

_graph = build_graph()


@router.post("", response_model=ResearchResponse)
async def run_research(req: ResearchRequest) -> ResearchResponse:
    try:
        result = await _graph.ainvoke(
            {
                "query": req.query,
                "tasks": [],
                "results": [],
                "gaps": [],
                "round": 0,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    sources = list({s for r in result["results"] for s in r["sources"]})
    return ResearchResponse(
        query=req.query,
        report=result["report"],
        sources=sources,
    )
