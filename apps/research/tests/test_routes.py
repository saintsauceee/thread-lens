from unittest.mock import AsyncMock, MagicMock, patch


async def test_clarify_returns_questions(client):
    questions = ["What platform?", "What time range?"]
    with patch("research.routes.research.clarify_query", new=AsyncMock(return_value=questions)):
        r = await client.get("/research/clarify", params={"query": "best keyboards"})
    assert r.status_code == 200
    assert r.json() == {"questions": questions}


async def test_clarify_passes_fast_flag(client):
    with patch("research.routes.research.clarify_query", new=AsyncMock(return_value=[])) as mock:
        await client.get("/research/clarify", params={"query": "test", "fast": "true"})
    mock.assert_called_once_with("test", True)


async def test_list_kbs_returns_list(client, mock_db):
    kbs = [{"id": "1", "query": "rust vs go", "status": "complete"}]
    with patch("research.routes.research.list_kbs", new=AsyncMock(return_value=kbs)):
        r = await client.get("/research/kbs")
    assert r.status_code == 200
    assert r.json() == kbs


async def test_list_kbs_empty(client, mock_db):
    with patch("research.routes.research.list_kbs", new=AsyncMock(return_value=[])):
        r = await client.get("/research/kbs")
    assert r.status_code == 200
    assert r.json() == []


async def test_get_kb_returns_kb(client, mock_db):
    kb = {"id": "abc", "query": "test", "artifact": "", "status": "incomplete"}
    with patch("research.routes.research.get_kb", new=AsyncMock(return_value=kb)):
        r = await client.get("/research/kb/abc")
    assert r.status_code == 200
    assert r.json()["id"] == "abc"


async def test_get_kb_not_found(client, mock_db):
    with patch("research.routes.research.get_kb", new=AsyncMock(return_value=None)):
        r = await client.get("/research/kb/missing")
    assert r.status_code == 404
    assert r.json()["detail"] == "KB not found"


async def test_delete_kb(client, mock_db):
    with patch("research.routes.research.delete_kb", new=AsyncMock()):
        r = await client.delete("/research/kb/abc")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


async def test_cancel_session(client, mock_db):
    with patch("research.routes.research.cancel_session", new=AsyncMock()):
        r = await client.post("/research/session/sess-123/cancel")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


async def test_cancel_session_cancels_running_task(client, mock_db):
    mock_task = MagicMock()
    with patch.dict("research.routes.research._running_tasks", {"sess-123": mock_task}), \
         patch("research.routes.research.cancel_session", new=AsyncMock()):
        await client.post("/research/session/sess-123/cancel")
    mock_task.cancel.assert_called_once()


async def test_run_research_returns_artifact(client):
    graph_result = {
        "artifact": "# Research Report",
        "results": [{"sources": ["https://reddit.com/r/a"]}],
    }
    with patch("research.routes.research._graph.ainvoke", new=AsyncMock(return_value=graph_result)):
        r = await client.post("/research", json={"query": "best keyboards"})
    assert r.status_code == 200
    body = r.json()
    assert body["artifact"] == "# Research Report"
    assert body["query"] == "best keyboards"
    assert body["sources"] == ["https://reddit.com/r/a"]


async def test_run_research_deduplicates_sources(client):
    graph_result = {
        "artifact": "# Report",
        "results": [
            {"sources": ["https://reddit.com/r/a", "https://reddit.com/r/b"]},
            {"sources": ["https://reddit.com/r/a"]},
        ],
    }
    with patch("research.routes.research._graph.ainvoke", new=AsyncMock(return_value=graph_result)):
        r = await client.post("/research", json={"query": "test"})
    assert len(r.json()["sources"]) == 2


async def test_run_research_returns_500_on_error(client):
    with patch("research.routes.research._graph.ainvoke", new=AsyncMock(side_effect=Exception("LLM failed"))):
        r = await client.post("/research", json={"query": "test"})
    assert r.status_code == 500
    assert "LLM failed" in r.json()["detail"]
