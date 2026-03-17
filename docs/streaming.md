# Streaming

The `/research/stream` endpoint streams research progress as [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events). This is the primary interface the frontend uses to display live agent activity.

## Connecting

```
GET /research/stream?query=...&clarifications=...&kb_id=...
```

Each event is a JSON object sent as the `data` field of an SSE message:

```
data: {"type": "kb_id", "id": "abc123"}

data: {"type": "orchestrator_phase", "phase": "thinking"}

data: {"type": "done"}
```

## Event sequence

A typical session emits events in this order:

```
kb_id
session_id
orchestrator_phase (thinking)         ← orchestrator planning tasks

orchestrator_phase (spawning)         ← tasks dispatched to subagents

  agent_spawned (id: 0, round: 1)
  agent_spawned (id: 1, round: 1)
  ...

  tool_call (active)                  ← subagent calls a Reddit tool
  tool_call (done)
  ...

  agent_done (id: 0)
  agent_done (id: 1)
  ...

orchestrator_phase (evaluating)       ← orchestrator reviews findings

[optional round 2 if gaps found:]
  orchestrator_phase (spawning)
  agent_spawned (id: N, round: 2)
  ...
  agent_done (id: N)
  orchestrator_phase (evaluating)

orchestrator_phase (synthesizing)     ← synthesizer running

artifact_ready                        ← final artifact
done                                  ← session complete
```

For refocus sessions, an extra `orchestrator_phase (thinking)` is emitted before `spawning`.

## Event reference

### `kb_id`
```json
{ "type": "kb_id", "id": "string" }
```
The knowledge base ID allocated for this session. Emitted before any agent activity.

---

### `session_id`
```json
{ "type": "session_id", "id": "string" }
```
The session ID for this run. Can be used to cancel via `POST /research/session/{id}/cancel`.

---

### `orchestrator_phase`
```json
{ "type": "orchestrator_phase", "phase": "thinking" | "spawning" | "evaluating" | "synthesizing" }
```

| Phase | When |
|-------|------|
| `thinking` | Orchestrator is planning tasks (or replanning on refocus) |
| `spawning` | Tasks have been planned, subagents are being dispatched |
| `evaluating` | Orchestrator is reviewing findings for completeness |
| `synthesizing` | Synthesizer is generating the final artifact |

---

### `agent_spawned`
```json
{
  "type": "agent_spawned",
  "id": 0,
  "task": "Budget accommodation options",
  "round": 1
}
```
A subagent has started. `id` is a sequential integer per session. `round` is `1` or `2`.

---

### `tool_call`
```json
{
  "type": "tool_call",
  "agentId": 0,
  "toolId": 0,
  "label": "travel",
  "status": "active" | "done"
}
```
A subagent is calling a Reddit tool. `label` is the subreddit name or a truncated search query. `toolId` is sequential per agent.

---

### `agent_done`
```json
{
  "type": "agent_done",
  "agentId": 0,
  "sourceCount": 4
}
```
A subagent has finished. `sourceCount` is the number of Reddit post URLs collected.

---

### `artifact_ready`
```json
{
  "type": "artifact_ready",
  "artifact": "# Research findings\n...",
  "durationSec": 42.3,
  "kbId": "string"
}
```
The final markdown artifact is ready. `durationSec` is the total wall-clock time for the session.

---

### `done`
```json
{ "type": "done" }
```
The session is complete. No further events will be sent.

---

## Cancellation

If the client disconnects or you want to stop a session early, call:

```
POST /research/session/{session_id}/cancel
```

The session is marked as cancelled in the database. Any findings collected before cancellation are saved to the KB and can be resumed.

## Error handling

If the stream generator throws an unhandled exception, the SSE connection closes without a `done` event. The session is automatically marked as cancelled in the `finally` block.
