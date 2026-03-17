# Research API

[![CI](https://github.com/saintsauceee/thread-lens/actions/workflows/ci.yml/badge.svg)](https://github.com/saintsauceee/thread-lens/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/saintsauceee/thread-lens/graph/badge.svg?token=YOUR_CODECOV_TOKEN&flag=research)](https://codecov.io/gh/saintsauceee/thread-lens)

FastAPI backend that orchestrates a multi-agent deep research pipeline grounded by Reddit posts.

## How it works

A research session runs through three stages:

```
Orchestrator → Subagents (parallel) → Orchestrator (eval) → Synthesizer
```

1. **Orchestrator** — breaks the query into focused research tasks (2–6 tasks)
2. **Subagents** — run in parallel, each searching Reddit using MCP tools
3. **Orchestrator** — evaluates the findings; if gaps remain, dispatches a second round
4. **Synthesizer** — consolidates all findings into a markdown artifact

## API

All endpoints are prefixed with `/research`.

### `GET /research/clarify`

Generate clarifying questions before starting research.

| Param | Type | Description |
|-------|------|-------------|
| `query` | string | The research query |
| `fast` | bool | Use faster/cheaper models (default: false) |

```json
{ "questions": ["...", "..."] }
```

---

### `GET /research/stream`

Stream a research session as Server-Sent Events.

| Param | Type | Description |
|-------|------|-------------|
| `query` | string | The research query |
| `fast` | bool | Use faster/cheaper models |
| `clarifications` | string (JSON) | Answers to clarifying questions |
| `kb_id` | string | Resume into an existing knowledge base |
| `follow_up` | string | Follow-up question for an existing KB |
| `refocus` | string | Redirect an in-progress session |
| `session_id` | string | Resume a cancelled session |

**SSE event types:**

| Event | Payload |
|-------|---------|
| `kb_id` | Knowledge base ID for this session |
| `session_id` | Session ID |
| `orchestrator_phase` | `thinking` · `spawning` · `evaluating` · `synthesizing` |
| `agent_spawned` | Agent ID + task |
| `tool_call` | Tool name, status (`active`/`done`), agent ID |
| `agent_done` | Agent ID + source count |
| `artifact_ready` | Markdown artifact + duration |
| `done` | Session complete |

---

### `POST /research`

Run research synchronously and return the final artifact.

**Body:**
```json
{ "query": "string" }
```

**Response:**
```json
{
  "query": "string",
  "artifact": "markdown string",
  "sources": ["https://..."]
}
```

---

### `GET /research/kbs`

List all saved knowledge bases.

---

### `GET /research/kb/{kb_id}`

Get a specific knowledge base by ID.

---

### `DELETE /research/kb/{kb_id}`

Delete a knowledge base and all associated sessions and findings.

---

### `POST /research/session/{session_id}/cancel`

Cancel an in-progress research session.

---

## Agent graph

```
START → orchestrator
            ↓
    ┌───────┴────────┐
  subagent       synthesizer
  (parallel)         ↓
    └───→ orchestrator  END
```

Subagents are dispatched in parallel via LangGraph's `Send()`. Results accumulate in state and feed back to the orchestrator for evaluation. A second round runs if gaps are identified (max 2 rounds).

## Models

| Mode | Model |
|------|-------|
| Default | `gemini-2.5-flash` |
| Fast (`fast=true`) | `gemini-3.1-flash-lite-preview` |

## Environment variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY_1` … `GOOGLE_API_KEY_5` | Google AI API keys (rotated automatically) |
| `GOOGLE_API_KEY` | Fallback if numbered keys are not set |
| `THREAD_LENS_DB_PATH` | Path to the SQLite database file |

The key rotator tracks per-key RPM (4/min) and RPD (18/day) limits and backs off automatically on rate limit errors.

## Internal packages

**`packages/db`** — shared SQLite layer. The research app uses it to persist knowledge bases, sessions, and findings. The database path is configured via `THREAD_LENS_DB_PATH`.

**`packages/mcp-reddit`** — MCP server that exposes Reddit tools (`search_reddit`, `get_post`, `get_top_posts`) to subagents. The research app spawns it as a subprocess at runtime via `langchain-mcp-adapters`. It must be installed alongside the research app (handled automatically in Docker).
