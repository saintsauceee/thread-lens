# Multi-Agent Architecture

Thread Lens uses a multi-agent pipeline built on [LangGraph](https://github.com/langchain-ai/langgraph). A research session is a stateful graph that coordinates three types of agents: an orchestrator, parallel subagents, and a synthesizer.

## Graph overview

```
START
  │
  ▼
orchestrator ──────────────────────────────────────────┐
  │                                                     │
  │ (dispatches tasks via Send)                         │
  ▼                                                     │
subagent   subagent   subagent   ...  (parallel)        │
  │           │          │                              │
  └───────────┴──────────┘                              │
              │ (results accumulate in state)            │
              ▼                                         │
         orchestrator (evaluation round)                │
              │                                         │
              ├── gaps found & round < 2 ───────────────┘
              │
              └── sufficient or round >= 2
                        │
                        ▼
                   synthesizer
                        │
                        ▼
                       END
```

Subagents are dispatched in parallel using LangGraph's `Send()` primitive. Each subagent runs independently and its results are merged back into the shared state via `operator.add`.

---

## Agents

### Orchestrator

The orchestrator runs multiple times in a session and has three modes:

**Planning mode** (first run)
- Receives the user query, clarifications, and any existing KB findings
- Produces 2–6 `ResearchTask` objects, each with a topic, subreddits, and a focus angle
- Avoids duplicating topics already covered in the knowledge base

**Refocus mode**
- Triggered when the user provides a refocus instruction mid-session
- Generates new tasks that extend or redirect the existing findings
- Does not duplicate already-covered topics

**Evaluation mode** (after subagents complete)
- Reviews all collected findings against the original query
- Outputs `{ sufficient: bool, gaps: [...] }`
- If gaps remain and it's the first round, dispatches a second round of subagents targeting those gaps
- If sufficient (or round 2 is done), hands off to the synthesizer

### Subagents

Each subagent receives a single `ResearchTask` and uses a LangChain ReAct agent to research it.

**Tools available (via MCP):**
- `search_reddit(query, subreddit)` — search Reddit for posts matching a query
- `get_post(post_id)` — fetch a full post with comments
- `get_top_posts(subreddit)` — fetch top posts from a subreddit

**Process:**
1. Searches relevant subreddits based on the task
2. Reads posts and comments for concrete information
3. Returns a `SubagentResult` with findings and source URLs

Subagents retry on rate limit errors using automatic key rotation (see [Key rotation](#key-rotation)).

### Synthesizer

Receives all findings (both from prior KB sessions and the current session) and produces the final markdown artifact. It is instructed to write in a direct, opinionated style — not a neutral summary — and to fully integrate old and new findings rather than appending sections.

---

## State

The graph state is a `TypedDict` that flows through every node:

| Field | Type | Description |
|-------|------|-------------|
| `query` | str | Original user query |
| `fast` | bool | Use cheaper/faster models |
| `clarifications` | list | Q&A pairs from the clarification phase |
| `refocus` | str | User refocus instruction |
| `refocus_dispatched` | bool | Whether refocus tasks have been sent |
| `kb_id` | str | Knowledge base ID for this session |
| `kb_existing_results` | list | Findings from prior sessions in this KB |
| `kb_existing_artifact` | str | Prior artifact from this KB |
| `follow_up` | str | Follow-up question for a KB continuation |
| `tasks` | list[ResearchTask] | Tasks planned by the orchestrator |
| `current_task` | ResearchTask | Task assigned to a specific subagent |
| `results` | list[SubagentResult] | Accumulated findings (merged via `operator.add`) |
| `gaps` | list[str] | Gaps identified by the orchestrator evaluation |
| `artifact` | str | Final markdown artifact |
| `round` | int | Current research round (1 or 2) |

---

## Models

All LLM calls use Google Gemini. The model depends on whether fast mode is enabled:

| Component | Default | Fast mode |
|---|---|---|
| Orchestrator | `gemini-2.5-flash` | `gemini-3.1-flash-lite-preview` |
| Subagent | `gemini-2.5-flash` | `gemini-3.1-flash-lite-preview` |
| Synthesizer | `gemini-2.5-flash` | `gemini-3.1-flash-lite-preview` |

Fast mode skips the clarification phase and uses cheaper models throughout.

---

## Key rotation

Subagents use Google Gemini models. To work around free-tier rate limits, the app rotates across up to 5 API keys (`GOOGLE_API_KEY_1` through `GOOGLE_API_KEY_5`). If none are set, it falls back to a single `GOOGLE_API_KEY`.

The `KeyRotator` tracks per-key usage:
- **RPM limit:** 4 requests/minute
- **RPD limit:** 18 requests/day

When a key hits a 429 error, it is marked as temporarily exhausted and the rotator skips it. If all keys are exhausted, the agent sleeps and retries with exponential backoff.

---

## Knowledge base

Research sessions are persisted to SQLite via `packages/db`. Each session belongs to a **knowledge base (KB)** — a collection of findings and a synthesized artifact tied to a query.

A KB can be continued: follow-up questions and refocus instructions extend the existing findings rather than starting fresh. The orchestrator and synthesizer both receive the prior KB artifact and findings as context.

---

## MCP integration

Subagents access Reddit through a local MCP server (`packages/mcp-reddit`). The research app spawns it as a subprocess at runtime using `langchain-mcp-adapters`. This keeps the Reddit tooling isolated and independently runnable.
