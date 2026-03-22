# MCP Reddit

MCP server that exposes Reddit's public JSON API as tools for AI agents. Used by the research sub-agents to search and read Reddit posts and comments.

## Setup

```bash
pip install -e .
mcp-reddit          # run the MCP server
```

No API key required — uses Reddit's public `.json` endpoints.

## Tools

| Tool | Description |
|---|---|
| `search_reddit(query, subreddit?, sort?, time_filter?, limit?)` | Search posts across Reddit or within a subreddit |
| `get_post(post_id, comment_limit?)` | Fetch a post and its top-level comments |
| `get_top_posts(subreddit, time_filter?, limit?)` | Get top posts from a subreddit |

### Defaults & limits

- `sort`: `"relevance"` (options: `relevance`, `hot`, `top`, `new`)
- `time_filter`: `"year"` for search, `"month"` for top posts (options: `hour`, `day`, `week`, `month`, `year`, `all`)
- `limit`: 10 (max 25 for search/top, max 50 for comments)
- Post body truncated to 500 chars, comment body to 600 chars

## Structure

```
src/mcp_reddit/
├── server.py     # MCP tool definitions + response formatting
└── reddit.py     # Reddit HTTP client (httpx, public JSON API)
```
