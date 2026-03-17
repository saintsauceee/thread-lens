import json
from unittest.mock import AsyncMock, MagicMock, patch


def parse_sse(text: str) -> list[dict]:
    """Extract JSON payloads from raw SSE text."""
    events = []
    for line in text.splitlines():
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))
    return events


def make_patches(graph_events=None):
    """Return a dict of patches shared across stream tests."""
    async def _fake_stream(*args, **kwargs):
        for event in (graph_events or []):
            yield event

    mock_graph = MagicMock()
    mock_graph.astream_events = _fake_stream

    return {
        "research.routes.research._graph": mock_graph,
        "research.routes.research.create_kb": AsyncMock(return_value={"id": "kb-1"}),
        "research.routes.research.create_session": AsyncMock(return_value={"id": "sess-1"}),
        "research.routes.research.update_artifact": AsyncMock(),
        "research.routes.research.complete_session": AsyncMock(),
        "research.routes.research.cancel_session": AsyncMock(),
    }


async def test_stream_emits_initial_events(client, mock_db):
    patches = make_patches()
    with patch("research.routes.research._graph", patches["research.routes.research._graph"]), \
         patch("research.routes.research.create_kb", patches["research.routes.research.create_kb"]), \
         patch("research.routes.research.create_session", patches["research.routes.research.create_session"]), \
         patch("research.routes.research.update_artifact", patches["research.routes.research.update_artifact"]), \
         patch("research.routes.research.complete_session", patches["research.routes.research.complete_session"]), \
         patch("research.routes.research.cancel_session", patches["research.routes.research.cancel_session"]):
        r = await client.get("/research/stream", params={"query": "best keyboards"})

    events = parse_sse(r.text)
    types = [e["type"] for e in events]
    assert types[:3] == ["kb_id", "session_id", "orchestrator_phase"]
    assert events[0]["id"] == "kb-1"
    assert events[1]["id"] == "sess-1"
    assert events[2]["phase"] == "thinking"


async def test_stream_full_happy_path(client, mock_db):
    graph_events = [
        {
            "event": "on_chain_end",
            "name": "synthesizer",
            "run_id": "r1",
            "data": {"output": {"artifact": "# My Report"}},
            "parent_ids": [],
        }
    ]
    patches = make_patches(graph_events)
    with patch("research.routes.research._graph", patches["research.routes.research._graph"]), \
         patch("research.routes.research.create_kb", patches["research.routes.research.create_kb"]), \
         patch("research.routes.research.create_session", patches["research.routes.research.create_session"]), \
         patch("research.routes.research.update_artifact", patches["research.routes.research.update_artifact"]), \
         patch("research.routes.research.complete_session", patches["research.routes.research.complete_session"]), \
         patch("research.routes.research.cancel_session", patches["research.routes.research.cancel_session"]):
        r = await client.get("/research/stream", params={"query": "test"})

    events = parse_sse(r.text)
    types = [e["type"] for e in events]
    assert "artifact_ready" in types
    assert "done" in types
    artifact_event = next(e for e in events if e["type"] == "artifact_ready")
    assert artifact_event["artifact"] == "# My Report"
    assert artifact_event["kbId"] == "kb-1"


async def test_stream_cancels_session_when_graph_yields_nothing(client, mock_db):
    patches = make_patches(graph_events=[])
    cancel_mock = patches["research.routes.research.cancel_session"]

    with patch("research.routes.research._graph", patches["research.routes.research._graph"]), \
         patch("research.routes.research.create_kb", patches["research.routes.research.create_kb"]), \
         patch("research.routes.research.create_session", patches["research.routes.research.create_session"]), \
         patch("research.routes.research.update_artifact", patches["research.routes.research.update_artifact"]), \
         patch("research.routes.research.complete_session", patches["research.routes.research.complete_session"]), \
         patch("research.routes.research.cancel_session", cancel_mock):
        await client.get("/research/stream", params={"query": "test"})

    cancel_mock.assert_called_once()


async def test_stream_parses_clarifications(client, mock_db):
    patches = make_patches()
    with patch("research.routes.research._graph", patches["research.routes.research._graph"]), \
         patch("research.routes.research.create_kb", patches["research.routes.research.create_kb"]), \
         patch("research.routes.research.create_session", patches["research.routes.research.create_session"]), \
         patch("research.routes.research.update_artifact", patches["research.routes.research.update_artifact"]), \
         patch("research.routes.research.complete_session", patches["research.routes.research.complete_session"]), \
         patch("research.routes.research.cancel_session", patches["research.routes.research.cancel_session"]):
        r = await client.get(
            "/research/stream",
            params={"query": "test", "clarifications": '["What platform?"]'},
        )
    assert r.status_code == 200


async def test_stream_ignores_invalid_clarifications(client, mock_db):
    patches = make_patches()
    with patch("research.routes.research._graph", patches["research.routes.research._graph"]), \
         patch("research.routes.research.create_kb", patches["research.routes.research.create_kb"]), \
         patch("research.routes.research.create_session", patches["research.routes.research.create_session"]), \
         patch("research.routes.research.update_artifact", patches["research.routes.research.update_artifact"]), \
         patch("research.routes.research.complete_session", patches["research.routes.research.complete_session"]), \
         patch("research.routes.research.cancel_session", patches["research.routes.research.cancel_session"]):
        r = await client.get(
            "/research/stream",
            params={"query": "test", "clarifications": "not-valid-json"},
        )
    assert r.status_code == 200


async def test_stream_follow_up_missing_kb_creates_new(client, mock_db):
    patches = make_patches()
    with patch("research.routes.research._graph", patches["research.routes.research._graph"]), \
         patch("research.routes.research.get_kb", AsyncMock(return_value=None)), \
         patch("research.routes.research.create_kb", patches["research.routes.research.create_kb"]), \
         patch("research.routes.research.create_session", patches["research.routes.research.create_session"]), \
         patch("research.routes.research.update_artifact", patches["research.routes.research.update_artifact"]), \
         patch("research.routes.research.complete_session", patches["research.routes.research.complete_session"]), \
         patch("research.routes.research.cancel_session", patches["research.routes.research.cancel_session"]):
        r = await client.get(
            "/research/stream",
            params={"query": "test", "kb_id": "missing-kb", "follow_up": "more detail"},
        )
    events = parse_sse(r.text)
    kb_event = next(e for e in events if e["type"] == "kb_id")
    assert kb_event["id"] == "kb-1"  # new KB was created


async def test_stream_refocus_loads_session_findings(client, mock_db):
    patches = make_patches()
    get_session_findings_mock = AsyncMock(return_value=[{"topic": "t", "findings": "f", "sources": []}])
    with patch("research.routes.research._graph", patches["research.routes.research._graph"]), \
         patch("research.routes.research.create_kb", patches["research.routes.research.create_kb"]), \
         patch("research.routes.research.create_session", patches["research.routes.research.create_session"]), \
         patch("research.routes.research.get_session_findings", get_session_findings_mock), \
         patch("research.routes.research.update_artifact", patches["research.routes.research.update_artifact"]), \
         patch("research.routes.research.complete_session", patches["research.routes.research.complete_session"]), \
         patch("research.routes.research.cancel_session", patches["research.routes.research.cancel_session"]):
        await client.get(
            "/research/stream",
            params={"query": "test", "session_id": "sess-old", "refocus": "focus on X"},
        )
    get_session_findings_mock.assert_called_once()


async def test_stream_follow_up_loads_existing_kb(client, mock_db):
    existing_kb = {"id": "kb-existing", "artifact": "# Old Report"}
    patches = make_patches()

    with patch("research.routes.research._graph", patches["research.routes.research._graph"]), \
         patch("research.routes.research.get_kb", AsyncMock(return_value=existing_kb)), \
         patch("research.routes.research.get_findings", AsyncMock(return_value=[])), \
         patch("research.routes.research.create_session", patches["research.routes.research.create_session"]), \
         patch("research.routes.research.update_artifact", patches["research.routes.research.update_artifact"]), \
         patch("research.routes.research.complete_session", patches["research.routes.research.complete_session"]), \
         patch("research.routes.research.cancel_session", patches["research.routes.research.cancel_session"]):
        r = await client.get(
            "/research/stream",
            params={"query": "follow up question", "kb_id": "kb-existing", "follow_up": "more detail"},
        )

    events = parse_sse(r.text)
    kb_event = next(e for e in events if e["type"] == "kb_id")
    assert kb_event["id"] == "kb-existing"
