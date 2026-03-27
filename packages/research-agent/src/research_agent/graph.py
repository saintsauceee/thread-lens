from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from .nodes import orchestrator_node, subagent_node, synthesizer_node
from .state import ResearchState, ResearchTask


def _route_after_orchestrator(state: ResearchState) -> list[Send] | str:
    results = state.get("results", [])
    gaps = state.get("gaps", [])

    if not results:
        # Planning pass: dispatch initial tasks
        return [
            Send("subagent", {**state, "current_task": task})
            for task in state["tasks"]
        ]
    elif state.get("refocus") and not state.get("refocus_dispatched"):
        # Refocus planning just ran: dispatch new tasks and mark as dispatched
        return [
            Send("subagent", {**state, "current_task": task, "refocus_dispatched": True})
            for task in state["tasks"]
        ]
    elif gaps and state.get("round", 1) < 2:
        # Evaluation pass: gaps found, dispatch round 2
        gap_tasks = [
            ResearchTask(topic=gap, subreddits=[], focus=gap)
            for gap in gaps
        ]
        return [
            Send("subagent", {**state, "current_task": task, "round": 2})
            for task in gap_tasks
        ]
    else:
        return "synthesizer"


def build_graph():
    graph = StateGraph(ResearchState)

    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("subagent", subagent_node)
    graph.add_node("synthesizer", synthesizer_node)

    graph.add_edge(START, "orchestrator")
    graph.add_conditional_edges("orchestrator", _route_after_orchestrator, ["subagent", "synthesizer"])
    graph.add_edge("subagent", "orchestrator")
    graph.add_edge("synthesizer", END)

    return graph.compile()
