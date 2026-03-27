FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /workspace

# Copy shared packages
COPY packages/db packages/db
COPY packages/events packages/events
COPY packages/research-agent packages/research-agent
COPY packages/mcp-reddit packages/mcp-reddit

# Copy worker app
COPY apps/worker apps/worker

# Pre-install mcp-reddit deps so uv run doesn't need network at runtime
RUN cd packages/mcp-reddit && uv sync --no-dev

# Install worker dependencies
WORKDIR /workspace/apps/worker
RUN uv sync --no-dev

CMD ["uv", "run", "python", "-m", "worker.main"]
