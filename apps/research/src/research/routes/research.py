from fastapi import APIRouter
from research.models import ResearchRequest, ResearchResponse

router = APIRouter(prefix="/research", tags=["research"])


@router.post("", response_model=ResearchResponse)
async def run_research(req: ResearchRequest) -> ResearchResponse:
    # TODO: wire up orchestrator + mcp-reddit
    return ResearchResponse(
        query=req.query,
        report=f"Research report for: {req.query}",
        sources=[],
    )
