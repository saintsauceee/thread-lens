# Thread Lens

A multi-agent deep research tool for Reddit. Ask a question, and a coordinated team of AI agents searches Reddit to synthesize a comprehensive answer.

## How it works

1. **Clarify** — The app asks follow-up questions to sharpen your query
2. **Orchestrate** — A planner agent breaks the query into sub-tasks
3. **Research** — Parallel sub-agents search Reddit posts, comments, and subreddits
4. **Synthesize** — A final agent consolidates findings into a structured artifact (report)
5. **History** — All research is saved and browsable

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | FastAPI, LangGraph |
| Reddit access | MCP server (`packages/mcp-reddit`) |
| Database | SQLite (shared via `packages/db`) |

## Project structure

```
apps/
  client/     # Next.js frontend
  research/   # FastAPI + LangGraph backend
packages/
  db/         # Shared SQLite layer
  mcp-reddit/ # MCP server exposing Reddit tools to agents
```

## Getting started

### Backend

```bash
cd apps/research
uv sync
uv run uvicorn main:app --reload
```

Runs on `http://localhost:8000`.

### Frontend

```bash
cd apps/client
npm install
npm run dev
```

Runs on `http://localhost:3000`.
