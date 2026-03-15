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


class Clarification(TypedDict):
    question: str
    answer: str


class ResearchState(TypedDict):
    query: str
    fast: bool
    clarifications: list[Clarification]
    refocus: str
    refocus_dispatched: bool
    kb_id: str
    kb_existing_results: list[SubagentResult]
    kb_existing_artifact: str
    follow_up: str
    tasks: list[ResearchTask]
    current_task: ResearchTask
    results: Annotated[list[SubagentResult], operator.add]
    gaps: list[str]
    artifact: str
    round: int
