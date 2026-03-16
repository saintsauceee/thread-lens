FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /workspace

# Copy shared packages
COPY packages/db packages/db
COPY packages/mcp-reddit packages/mcp-reddit

# Copy research app
COPY apps/research apps/research

# Pre-install mcp-reddit deps so uv run doesn't need network at runtime
RUN cd packages/mcp-reddit && uv sync --no-dev

# Install research app dependencies
WORKDIR /workspace/apps/research
RUN uv sync --no-dev

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "research.main:app", "--host", "0.0.0.0", "--port", "8000"]
