from __future__ import annotations

import httpx

BASE_URL = "https://www.reddit.com"
HEADERS = {"User-Agent": "thread-lens:mcp-reddit/0.1.0 (by /u/thread-lens)"}


def _post_to_dict(data: dict) -> dict:
    return {
        "id": data.get("id"),
        "title": data.get("title"),
        "subreddit": data.get("subreddit"),
        "score": data.get("score"),
        "num_comments": data.get("num_comments"),
        "url": f"https://reddit.com{data.get('permalink', '')}",
        "selftext": (data.get("selftext") or "")[:500],
        "created_utc": data.get("created_utc"),
    }


def _comment_to_dict(data: dict) -> dict:
    return {
        "author": data.get("author"),
        "score": data.get("score"),
        "body": (data.get("body") or "")[:600],
    }


async def search(
    query: str,
    subreddit: str = "",
    sort: str = "relevance",
    time_filter: str = "year",
    limit: int = 10,
) -> list[dict]:
    """Search Reddit posts, optionally within a specific subreddit."""
    path = f"/r/{subreddit}/search.json" if subreddit else "/search.json"
    params: dict = {
        "q": query,
        "sort": sort,
        "t": time_filter,
        "limit": limit,
        "type": "link",
    }
    if subreddit:
        params["restrict_sr"] = "1"

    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BASE_URL}{path}", params=params, headers=HEADERS)
        r.raise_for_status()
        children = r.json()["data"]["children"]
        return [_post_to_dict(c["data"]) for c in children]


async def get_post(post_id: str, comment_limit: int = 20) -> tuple[dict, list[dict]]:
    """Fetch a post and its top-level comments by post ID."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{BASE_URL}/comments/{post_id}.json",
            params={"limit": comment_limit, "depth": 2},
            headers=HEADERS,
        )
        r.raise_for_status()
        data = r.json()

    post = _post_to_dict(data[0]["data"]["children"][0]["data"])
    comments = [
        _comment_to_dict(c["data"])
        for c in data[1]["data"]["children"]
        if c.get("kind") == "t1"
    ]
    return post, comments


async def get_top_posts(
    subreddit: str,
    time_filter: str = "month",
    limit: int = 10,
) -> list[dict]:
    """Get top posts from a subreddit by time period."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{BASE_URL}/r/{subreddit}/top.json",
            params={"t": time_filter, "limit": limit},
            headers=HEADERS,
        )
        r.raise_for_status()
        children = r.json()["data"]["children"]
        return [_post_to_dict(c["data"]) for c in children]
