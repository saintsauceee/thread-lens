import asyncio
import json
import re

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent, ToolNode

from .key_rotator import get_rotator
from .prompts import CLARIFY_SYSTEM, ORCHESTRATOR_EVAL_SYSTEM, ORCHESTRATOR_REFOCUS_SYSTEM, ORCHESTRATOR_SYSTEM, SUBAGENT_SYSTEM, SYNTHESIZER_SYSTEM
from .state import ResearchState, ResearchTask, SubagentResult
from .tools import get_mcp_client

ORCHESTRATOR_MODEL = "gemini-2.5-flash"
ORCHESTRATOR_MODEL_FAST = "gemini-3.1-flash-lite-preview"

SUBAGENT_MODEL = "gemini-2.5-flash"
SUBAGENT_MODEL_FAST = "gemini-3.1-flash-lite-preview"


def _model(model_name: str) -> tuple[ChatGoogleGenerativeAI, str]:
    """Get a model instance and its key using the next available API key."""
    key = get_rotator().get_key()
    return ChatGoogleGenerativeAI(model=model_name, google_api_key=key), key


def _is_rate_limit(e: Exception) -> bool:
    s = str(e).upper()
    return "429" in s or "QUOTA" in s or "RESOURCE_EXHAUSTED" in s


async def _invoke(messages: list, model_name: str) -> object:
    """Invoke the model with automatic key rotation and backoff on 429."""
    rotator = get_rotator()
    for attempt in range(len(rotator._keys) * 2 + 1):
        try:
            model, key = _model(model_name)
            return await model.ainvoke(messages)
        except Exception as e:
            if _is_rate_limit(e):
                rotator.mark_rate_limited(key)
                if attempt >= len(rotator._keys):
                    await asyncio.sleep(30)
                continue
            raise
    raise RuntimeError("All API keys exhausted after retries")


def _content_text(content) -> str:
    if isinstance(content, list):
        return "".join(
            p.get("text", "") if isinstance(p, dict) else getattr(p, "text", str(p))
            for p in content
        )
    return str(content)


def _parse_json(content) -> dict | list:
    text = _content_text(content)
    match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
    return json.loads(match.group(1) if match else text)


async def clarify_query(query: str, fast: bool = False) -> list[str]:
    """Call LLM to generate clarifying questions for the query."""
    model_name = ORCHESTRATOR_MODEL_FAST if fast else ORCHESTRATOR_MODEL
    response = await _invoke([
        {"role": "system", "content": CLARIFY_SYSTEM},
        {"role": "user", "content": query},
    ], model_name)
    return _parse_json(response.content)


async def orchestrator_node(state: ResearchState) -> dict:
    results = state.get("results", [])
    model_name = ORCHESTRATOR_MODEL_FAST if state.get("fast") else ORCHESTRATOR_MODEL

    if not results:
        # Planning mode: break query into tasks
        clarifications = state.get("clarifications") or []
        user_content = state["query"]
        if clarifications:
            qa_lines = "\n".join(f"Q: {c['question']}\nA: {c['answer']}" for c in clarifications if c.get("answer"))
            if qa_lines:
                user_content += f"\n\nUser clarifications:\n{qa_lines}"
        response = await _invoke([
            {"role": "system", "content": ORCHESTRATOR_SYSTEM},
            {"role": "user", "content": user_content},
        ], model_name)
        tasks: list[ResearchTask] = _parse_json(response.content)
        return {"tasks": tasks, "round": state.get("round", 0) + 1}
    elif state.get("refocus") and not state.get("refocus_dispatched"):
        # Refocus planning mode: generate new tasks based on instruction + existing findings
        findings_summary = "\n\n".join(
            f"### {r['topic']}\n{r['findings'][:400]}" for r in results
        )
        user_content = (
            f"Original query: {state['query']}\n\n"
            f"Already researched:\n{findings_summary}\n\n"
            f"User refocus instruction: {state['refocus']}"
        )
        response = await _invoke([
            {"role": "system", "content": ORCHESTRATOR_REFOCUS_SYSTEM},
            {"role": "user", "content": user_content},
        ], model_name)
        tasks: list[ResearchTask] = _parse_json(response.content)
        return {"tasks": tasks, "round": 1}
    else:
        # Evaluation mode: check if findings are sufficient
        if state.get("round", 1) >= 2 or state.get("refocus_dispatched"):
            return {"gaps": []}
        findings_summary = "\n\n".join(
            f"### {r['topic']}\n{r['findings'][:600]}" for r in results
        )
        response = await _invoke([
            {"role": "system", "content": ORCHESTRATOR_EVAL_SYSTEM},
            {"role": "user", "content": f"Query: {state['query']}\n\nFindings:\n{findings_summary}"},
        ], model_name)
        evaluation = _parse_json(response.content)
        gaps = [] if evaluation.get("sufficient") else evaluation.get("gaps", [])
        return {"gaps": gaps}


async def subagent_node(state: ResearchState) -> dict:
    task: ResearchTask = state["current_task"]
    user_msg = (
        f"Research task: {task['topic']}\n"
        f"Focus: {task['focus']}\n"
        f"Suggested subreddits: {', '.join(task['subreddits']) or 'any relevant'}\n\n"
        f"Original query: {state['query']}"
    )

    model_name = SUBAGENT_MODEL_FAST if state.get("fast") else SUBAGENT_MODEL
    last_exc: Exception | None = None
    rotator = get_rotator()
    for attempt in range(6):
        try:
            model, key = _model(model_name)
            client = get_mcp_client()
            tools = await client.get_tools()
            tool_node = ToolNode(tools, handle_tool_errors=True)
            agent = create_react_agent(model, tool_node, prompt=SUBAGENT_SYSTEM)
            result = await agent.ainvoke({"messages": [{"role": "user", "content": user_msg}]})
            break
        except Exception as e:
            if _is_rate_limit(e):
                last_exc = e
                rotator.mark_rate_limited(key)
                sleep_s = 15 if attempt < len(rotator._keys) else 30 * (attempt - len(rotator._keys) + 1)
                await asyncio.sleep(sleep_s)
                continue
            raise
    else:
        raise last_exc  # type: ignore[misc]

    findings = result["messages"][-1].content

    sources: list[str] = []
    for msg in result["messages"]:
        # URLs from get_post calls
        for tc in getattr(msg, "tool_calls", []):
            args = tc.get("args", {}) if isinstance(tc, dict) else getattr(tc, "args", {})
            if "post_id" in args:
                sources.append(f"https://reddit.com/comments/{args['post_id']}")
        # URLs embedded in tool result content (search_reddit returns url fields)
        content = getattr(msg, "content", "")
        if isinstance(content, str):
            sources.extend(re.findall(r'https://reddit\.com/r/[^\s"\']+', content))

    return {
        "results": [
            SubagentResult(
                topic=task["topic"],
                findings=findings,
                sources=list(set(sources)),
            )
        ]
    }



async def synthesizer_node(state: ResearchState) -> dict:
    all_findings = "\n\n---\n\n".join(
        f"## {r['topic']}\n{r['findings']}" for r in state["results"]
    )
    all_sources = list({s for r in state["results"] for s in r["sources"]})

    model_name = SUBAGENT_MODEL_FAST if state.get("fast") else SUBAGENT_MODEL
    response = await _invoke(
        [
            {"role": "system", "content": SYNTHESIZER_SYSTEM},
            {
                "role": "user",
                "content": f"Query: {state['query']}\n\nAgent findings:\n{all_findings}",
            },
        ],
        model_name,
    )

    report = _content_text(response.content)
    if all_sources:
        report += "\n\n## Sources\n" + "\n".join(f"- {s}" for s in all_sources)

    return {"report": report}
