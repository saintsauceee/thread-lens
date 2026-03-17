![Thread Lens](./docs/images/threadlens-readme-banner-resized.png)

# Thread Lens

**Multi-agent deep research, sourced from Reddit.**

![CI](https://github.com/saintsauceee/thread-lens/actions/workflows/ci.yml/badge.svg)
![Docker](https://img.shields.io/badge/docker%20compose-ready-blue?logo=docker)
![License](https://img.shields.io/badge/license-MIT-green)

---

## How it works

| Step | What happens |
|------|-------------|
| **Clarify** | Follow-up questions sharpen your query |
| **Orchestrate** | A planner agent breaks it into sub-tasks |
| **Research** | Parallel sub-agents search Reddit posts and subreddits |
| **Synthesize** | A final agent consolidates findings into a structured report |
| **History** | All research is saved and browsable |

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | FastAPI, LangGraph |
| Reddit access | MCP server (`packages/mcp-reddit`) |
| Database | SQLite (`packages/db`) |

## Getting started

### Docker (recommended)

```bash
cp .env.example .env  # fill in your API keys
docker compose up
```

Frontend → `http://localhost:3000` · Backend → `http://localhost:8000`

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
