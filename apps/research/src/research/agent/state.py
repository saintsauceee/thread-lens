import operator
from typing import Annotated, TypedDict


class ResearchTask(TypedDict):
    topic: str
    subreddits: list[str]
    focus: str


class SubagentResult(TypedDict):
    topic: str
    findings: str
    sources: list[str]


class ResearchState(TypedDict):
    query: str
    tasks: list[ResearchTask]
    current_task: ResearchTask
    results: Annotated[list[SubagentResult], operator.add]
    gaps: list[str]
    report: str
    round: int
