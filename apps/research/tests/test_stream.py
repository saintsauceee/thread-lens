import json
from unittest.mock import AsyncMock, patch


def parse_sse(text: str) -> list[dict]:
    """Extract JSON payloads from raw SSE text."""
    events = []
    for line in text.splitlines():
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))
    return events


async def _fake_subscribe(redis_url, session_id):
    """Simulate a worker publishing events via Redis pub/sub."""
    yield {"type": "orchestrator_phase", "phase": "thinking"}
    yield {"type": "agent_spawned", "id": 0, "task": "research keyboards", "round": 1}
    yield {"type": "agent_done", "agentId": 0, "sourceCount": 3}
    yield {"type": "orchestrator_phase", "phase": "synthesizing"}
    yield {"type": "artifact_ready", "artifact": "# Report", "durationSec": 5.2, "kbId": "kb-1"}
    yield {"type": "done"}


async def _fake_subscribe_empty(redis_url, session_id):
    """Simulate a worker that immediately errors."""
    yield {"type": "error", "message": "something broke"}


async def test_stream_emits_kb_and_session_ids(client, mock_db):
    with patch("research.routes.research.create_kb", AsyncMock(return_value={"id": "kb-1"})), \
         patch("research.routes.research.create_session", AsyncMock(return_value={"id": "sess-1"})), \
         patch("research.routes.research.subscribe_events", _fake_subscribe):
        r = await client.get("/research/stream", params={"query": "best keyboards"})

    events = parse_sse(r.text)
    types = [e["type"] for e in events]
    assert types[0] == "kb_id"
    assert types[1] == "session_id"
    assert events[0]["id"] == "kb-1"
    assert events[1]["id"] == "sess-1"


async def test_stream_publishes_job_to_rabbitmq(client, mock_db, mock_rabbitmq):
    with patch("research.routes.research.create_kb", AsyncMock(return_value={"id": "kb-1"})), \
         patch("research.routes.research.create_session", AsyncMock(return_value={"id": "sess-1"})), \
         patch("research.routes.research.subscribe_events", _fake_subscribe):
        await client.get("/research/stream", params={"query": "best keyboards", "fast": "true"})

    mock_rabbitmq.default_exchange.publish.assert_called_once()
    call_args = mock_rabbitmq.default_exchange.publish.call_args
    message_body = json.loads(call_args[0][0].body)
    assert message_body["query"] == "best keyboards"
    assert message_body["fast"] is True
    assert message_body["kb_id"] == "kb-1"
    assert message_body["session_id"] == "sess-1"


async def test_stream_relays_worker_events_as_sse(client, mock_db):
    with patch("research.routes.research.create_kb", AsyncMock(return_value={"id": "kb-1"})), \
         patch("research.routes.research.create_session", AsyncMock(return_value={"id": "sess-1"})), \
         patch("research.routes.research.subscribe_events", _fake_subscribe):
        r = await client.get("/research/stream", params={"query": "test"})

    events = parse_sse(r.text)
    types = [e["type"] for e in events]
    # First two are kb_id and session_id from the API itself
    # The rest come from the worker via Redis pub/sub
    assert "agent_spawned" in types
    assert "agent_done" in types
    assert "artifact_ready" in types
    assert "done" in types


async def test_stream_invalidates_cache_on_done(client, mock_db):
    with patch("research.routes.research.create_kb", AsyncMock(return_value={"id": "kb-1"})), \
         patch("research.routes.research.create_session", AsyncMock(return_value={"id": "sess-1"})), \
         patch("research.routes.research.subscribe_events", _fake_subscribe), \
         patch("research.routes.research.invalidate_kb", new_callable=AsyncMock) as mock_invalidate:
        await client.get("/research/stream", params={"query": "test"})

    mock_invalidate.assert_called_once_with("kb-1", "test-user-id")


async def test_stream_handles_worker_error(client, mock_db):
    with patch("research.routes.research.create_kb", AsyncMock(return_value={"id": "kb-1"})), \
         patch("research.routes.research.create_session", AsyncMock(return_value={"id": "sess-1"})), \
         patch("research.routes.research.subscribe_events", _fake_subscribe_empty):
        r = await client.get("/research/stream", params={"query": "test"})

    events = parse_sse(r.text)
    error_event = next((e for e in events if e["type"] == "error"), None)
    assert error_event is not None
    assert error_event["message"] == "something broke"


async def test_stream_parses_clarifications(client, mock_db, mock_rabbitmq):
    with patch("research.routes.research.create_kb", AsyncMock(return_value={"id": "kb-1"})), \
         patch("research.routes.research.create_session", AsyncMock(return_value={"id": "sess-1"})), \
         patch("research.routes.research.subscribe_events", _fake_subscribe):
        await client.get(
            "/research/stream",
            params={"query": "test", "clarifications": '[{"question":"Q","answer":"A"}]'},
        )

    call_args = mock_rabbitmq.default_exchange.publish.call_args
    message_body = json.loads(call_args[0][0].body)
    assert message_body["clarifications"] == [{"question": "Q", "answer": "A"}]


async def test_stream_ignores_invalid_clarifications(client, mock_db, mock_rabbitmq):
    with patch("research.routes.research.create_kb", AsyncMock(return_value={"id": "kb-1"})), \
         patch("research.routes.research.create_session", AsyncMock(return_value={"id": "sess-1"})), \
         patch("research.routes.research.subscribe_events", _fake_subscribe):
        await client.get(
            "/research/stream",
            params={"query": "test", "clarifications": "not-valid-json"},
        )

    call_args = mock_rabbitmq.default_exchange.publish.call_args
    message_body = json.loads(call_args[0][0].body)
    assert message_body["clarifications"] is None


async def test_stream_follow_up_missing_kb_creates_new(client, mock_db):
    with patch("research.routes.research.get_kb", AsyncMock(return_value=None)), \
         patch("research.routes.research.create_kb", AsyncMock(return_value={"id": "kb-new"})), \
         patch("research.routes.research.create_session", AsyncMock(return_value={"id": "sess-1"})), \
         patch("research.routes.research.subscribe_events", _fake_subscribe):
        r = await client.get(
            "/research/stream",
            params={"query": "test", "kb_id": "missing-kb", "follow_up": "more detail"},
        )

    events = parse_sse(r.text)
    kb_event = next(e for e in events if e["type"] == "kb_id")
    assert kb_event["id"] == "kb-new"


async def test_stream_follow_up_loads_existing_kb(client, mock_db):
    existing_kb = {"id": "kb-existing", "artifact": "# Old Report"}
    with patch("research.routes.research.get_kb", AsyncMock(return_value=existing_kb)), \
         patch("research.routes.research.get_findings", AsyncMock(return_value=[])), \
         patch("research.routes.research.create_session", AsyncMock(return_value={"id": "sess-1"})), \
         patch("research.routes.research.subscribe_events", _fake_subscribe):
        r = await client.get(
            "/research/stream",
            params={"query": "follow up", "kb_id": "kb-existing", "follow_up": "more detail"},
        )

    events = parse_sse(r.text)
    kb_event = next(e for e in events if e["type"] == "kb_id")
    assert kb_event["id"] == "kb-existing"


async def test_stream_refocus_loads_session_findings(client, mock_db):
    get_session_findings_mock = AsyncMock(return_value=[{"topic": "t", "findings": "f", "sources": []}])
    with patch("research.routes.research.create_kb", AsyncMock(return_value={"id": "kb-1"})), \
         patch("research.routes.research.create_session", AsyncMock(return_value={"id": "sess-1"})), \
         patch("research.routes.research.get_session_findings", get_session_findings_mock), \
         patch("research.routes.research.subscribe_events", _fake_subscribe):
        await client.get(
            "/research/stream",
            params={"query": "test", "session_id": "sess-old", "refocus": "focus on X"},
        )

    get_session_findings_mock.assert_called_once()
