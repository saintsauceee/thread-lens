import json
import re

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

from .prompts import EVALUATOR_SYSTEM, ORCHESTRATOR_SYSTEM, SUBAGENT_SYSTEM, SYNTHESIZER_SYSTEM
from .state import ResearchState, ResearchTask, SubagentResult
from .tools import get_mcp_client

MODEL = "gemini-2.0-flash"


def _parse_json(text: str) -> dict | list:
    match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
    return json.loads(match.group(1) if match else text)


async def orchestrator_node(state: ResearchState) -> dict:
    model = ChatGoogleGenerativeAI(model=MODEL)
    response = await model.ainvoke(
        [
            {"role": "system", "content": ORCHESTRATOR_SYSTEM},
            {"role": "user", "content": state["query"]},
        ]
    )
    tasks: list[ResearchTask] = _parse_json(response.content)
    return {"tasks": tasks, "round": state.get("round", 0) + 1}


async def subagent_node(state: ResearchState) -> dict:
    task: ResearchTask = state["current_task"]
    model = ChatGoogleGenerativeAI(model=MODEL)

    async with get_mcp_client() as client:
        tools = client.get_tools()
        agent = create_react_agent(model, tools, prompt=SUBAGENT_SYSTEM)
        user_msg = (
            f"Research task: {task['topic']}\n"
            f"Focus: {task['focus']}\n"
            f"Suggested subreddits: {', '.join(task['subreddits']) or 'any relevant'}\n\n"
            f"Original query: {state['query']}"
        )
        result = await agent.ainvoke({"messages": [{"role": "user", "content": user_msg}]})

    findings = result["messages"][-1].content

    # Extract Reddit post URLs from tool calls
    sources: list[str] = []
    for msg in result["messages"]:
        for tc in getattr(msg, "tool_calls", []):
            if "post_id" in tc.get("args", {}):
                sources.append(f"https://reddit.com/comments/{tc['args']['post_id']}")

    return {
        "results": [
            SubagentResult(
                topic=task["topic"],
                findings=findings,
                sources=list(set(sources)),
            )
        ]
    }


async def evaluator_node(state: ResearchState) -> dict:
    # Cap at 2 rounds
    if state.get("round", 1) >= 2:
        return {"gaps": []}

    model = ChatGoogleGenerativeAI(model=MODEL)
    findings_summary = "\n\n".join(
        f"### {r['topic']}\n{r['findings'][:600]}" for r in state["results"]
    )
    response = await model.ainvoke(
        [
            {"role": "system", "content": EVALUATOR_SYSTEM},
            {
                "role": "user",
                "content": f"Query: {state['query']}\n\nFindings:\n{findings_summary}",
            },
        ]
    )
    evaluation = _parse_json(response.content)
    gaps = [] if evaluation.get("sufficient") else evaluation.get("gaps", [])
    return {"gaps": gaps}


async def synthesizer_node(state: ResearchState) -> dict:
    model = ChatGoogleGenerativeAI(model=MODEL)
    all_findings = "\n\n---\n\n".join(
        f"## {r['topic']}\n{r['findings']}" for r in state["results"]
    )
    all_sources = list({s for r in state["results"] for s in r["sources"]})

    response = await model.ainvoke(
        [
            {"role": "system", "content": SYNTHESIZER_SYSTEM},
            {
                "role": "user",
                "content": f"Query: {state['query']}\n\nAgent findings:\n{all_findings}",
            },
        ]
    )

    report = response.content
    if all_sources:
        report += "\n\n## Sources\n" + "\n".join(f"- {s}" for s in all_sources)

    return {"report": report}
