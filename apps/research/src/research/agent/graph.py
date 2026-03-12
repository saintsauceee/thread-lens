from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from .nodes import evaluator_node, orchestrator_node, subagent_node, synthesizer_node
from .state import ResearchState, ResearchTask


def _dispatch_subagents(state: ResearchState) -> list[Send]:
    return [
        Send("subagent", {**state, "current_task": task})
        for task in state["tasks"]
    ]


def _route_after_evaluation(state: ResearchState) -> list[Send] | str:
    gaps = state.get("gaps", [])
    if gaps and state.get("round", 1) < 2:
        gap_tasks = [
            ResearchTask(topic=gap, subreddits=[], focus=gap)
            for gap in gaps
        ]
        return [
            Send("subagent", {**state, "current_task": task, "round": 2})
            for task in gap_tasks
        ]
    return "synthesizer"


def build_graph():
    graph = StateGraph(ResearchState)

    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("subagent", subagent_node)
    graph.add_node("evaluator", evaluator_node)
    graph.add_node("synthesizer", synthesizer_node)

    graph.add_edge(START, "orchestrator")
    graph.add_conditional_edges("orchestrator", _dispatch_subagents, ["subagent"])
    graph.add_edge("subagent", "evaluator")
    graph.add_conditional_edges(
        "evaluator", _route_after_evaluation, ["subagent", "synthesizer"]
    )
    graph.add_edge("synthesizer", END)

    return graph.compile()
