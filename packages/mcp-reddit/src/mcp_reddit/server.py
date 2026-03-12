from mcp.server.fastmcp import FastMCP

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from mcp_reddit import reddit

mcp = FastMCP("mcp-reddit")


def _format_posts(posts: list[dict]) -> str:
    if not posts:
        return "No results found."
    lines = []
    for i, p in enumerate(posts, 1):
        lines.append(
            f"[{i}] {p['title']} (r/{p['subreddit']})\n"
            f"    Score: {p['score']} | Comments: {p['num_comments']}\n"
            f"    URL: {p['url']}\n"
            + (f"    Preview: {p['selftext']}\n" if p["selftext"] else "")
        )
    return "\n".join(lines)


def _format_post_with_comments(post: dict, comments: list[dict]) -> str:
    lines = [
        f"POST: {post['title']}",
        f"Subreddit: r/{post['subreddit']}",
        f"Score: {post['score']} | Comments: {post['num_comments']}",
        f"URL: {post['url']}",
    ]
    if post["selftext"]:
        lines += ["", "Body:", post["selftext"]]

    if comments:
        lines += ["", "TOP COMMENTS:"]
        for i, c in enumerate(comments, 1):
            lines.append(f"[{i}] u/{c['author']} (score: {c['score']})\n    {c['body']}")

    return "\n".join(lines)


@mcp.tool()
async def search_reddit(
    query: str,
    subreddit: str = "",
    sort: str = "relevance",
    time_filter: str = "year",
    limit: int = 10,
) -> str:
    """
    Search Reddit posts.

    Args:
        query: Search query string.
        subreddit: Restrict search to this subreddit (e.g. "skiing"). Leave empty to search all of Reddit.
        sort: Sort order — "relevance", "hot", "top", or "new".
        time_filter: Time window — "hour", "day", "week", "month", "year", or "all".
        limit: Number of results (max 25).
    """
    posts = await reddit.search(query, subreddit, sort, time_filter, min(limit, 25))
    return _format_posts(posts)


@mcp.tool()
async def get_post(post_id: str, comment_limit: int = 20) -> str:
    """
    Get a Reddit post and its top comments.

    Args:
        post_id: The Reddit post ID (e.g. "abc123" from reddit.com/r/sub/comments/abc123/...).
        comment_limit: Number of top-level comments to fetch (max 50).
    """
    post, comments = await reddit.get_post(post_id, min(comment_limit, 50))
    return _format_post_with_comments(post, comments)


@mcp.tool()
async def get_top_posts(
    subreddit: str,
    time_filter: str = "month",
    limit: int = 10,
) -> str:
    """
    Get top posts from a subreddit.

    Args:
        subreddit: Subreddit name without the r/ prefix (e.g. "skiing").
        time_filter: Time window — "hour", "day", "week", "month", "year", or "all".
        limit: Number of posts to fetch (max 25).
    """
    posts = await reddit.get_top_posts(subreddit, time_filter, min(limit, 25))
    return _format_posts(posts)


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
