![Thread Lens](./docs/images/threadlens-readme-banner-resized.png)

<div align="center">

# Thread Lens

Multi-agent deep research, sourced from Reddit.

![CI](https://github.com/saintsauceee/thread-lens/actions/workflows/ci.yml/badge.svg)
![Docker](https://img.shields.io/badge/docker%20compose-ready-blue?logo=docker)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

## How it works

1. **Clarify** — The app asks follow-up questions to sharpen your query
2. **Orchestrate** — A planner agent breaks the query into sub-tasks
3. **Research** — Parallel sub-agents search Reddit posts, comments, and subreddits
4. **Synthesize** — A final agent consolidates findings into a structured artifact (report)
5. **History** — All research is saved and browsable

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (React, TypeScript, Tailwind CSS) |
| Backend | FastAPI, LangGraph |
| Reddit access | MCP server (`packages/mcp-reddit`) |
| Database | SQLite (`packages/db`) |

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

### Docker

```bash
cp .env.example .env  # fill in your API keys
docker compose up
```

Frontend at `http://localhost:3000`, backend at `http://localhost:8000`.

### Manual

**Backend**

```bash
cd apps/research
uv sync
uv run uvicorn research.main:app --reload
```

**Frontend**

```bash
cd apps/client
npm install
npm run dev
```

### Environment variables

See `.env.example`. You need at least one `GOOGLE_API_KEY_*` for the research agents.
