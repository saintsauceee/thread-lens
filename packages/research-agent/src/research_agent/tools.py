import os

from langchain_mcp_adapters.client import MultiServerMCPClient

# Resolve path to mcp-reddit from this file's location
# packages/research-agent/src/research_agent/tools.py -> ../../../../mcp-reddit
_MCP_REDDIT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../../mcp-reddit")
)


def get_mcp_client() -> MultiServerMCPClient:
    return MultiServerMCPClient(
        {
            "reddit": {
                "command": "uv",
                "args": ["run", "--directory", _MCP_REDDIT_DIR, "mcp-reddit"],
                "transport": "stdio",
            }
        }
    )
