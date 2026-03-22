# Knowledge Base

A **knowledge base (KB)** is the core persistence unit in Thread Lens. It ties together a research query, all findings collected across sessions, and the synthesized artifact.

## Data model

```
knowledge_bases
  id          TEXT  (UUID)
  query       TEXT  original research query
  artifact    TEXT  latest synthesized markdown artifact
  created_at  TEXT
  updated_at  TEXT

sessions
  id            TEXT  (UUID)
  kb_id         TEXT  → knowledge_bases.id (CASCADE delete)
  follow_up     TEXT  follow-up query text, if applicable
  created_at    TEXT
  completed_at  TEXT  set when synthesis completes
  cancelled_at  TEXT  set when session is cancelled or errors
  duration_sec  REAL  wall-clock duration of the session

findings
  id          INTEGER (autoincrement)
  kb_id       TEXT    → knowledge_bases.id (CASCADE delete)
  session_id  TEXT    which session produced this finding
  topic       TEXT    research subtopic
  findings    TEXT    agent findings text
  sources     TEXT    JSON array of Reddit URLs
  created_at  TEXT
```

A KB can have many sessions. Each session can produce many findings. The artifact on the KB is overwritten each time synthesis completes.

## Lifecycle

### 1. Creation

A new KB is created at the start of every `/stream` request that does not include a `kb_id + follow_up` pair. The KB ID is emitted as the first SSE event so the client can associate the session with it.

### 2. Research session

A session record is created immediately after KB resolution. As each subagent completes, its findings are written to the `findings` table linked to both the KB and the current session.

When synthesis completes:
- The KB `artifact` is updated with the markdown output
- The session `completed_at` timestamp is set

### 3. Cancellation

If the client disconnects or calls `POST /session/{id}/cancel`, the session `cancelled_at` timestamp is set. **Findings collected before cancellation are kept** — they remain in the KB and are available for follow-up sessions.

### 4. KB status

Status is computed from the database, not stored:

| Status | Condition |
|--------|-----------|
| `complete` | KB has a non-empty artifact |
| `cancelled` | Most recent session has a `cancelled_at` timestamp |
| `incomplete` | Most recent session has neither timestamp |

### 5. Deletion

`DELETE /kb/{kb_id}` removes the KB and all associated sessions and findings (cascade).

---

## Follow-up vs refocus

These are two different ways to continue research, and they work at different scopes.

### Follow-up

A follow-up starts a **new session on an existing KB**, extending it with a new question.

```
GET /stream?kb_id=...&follow_up=What about budget options?
```

- The existing KB's artifact and **all findings across all sessions** are loaded into the orchestrator context
- A new session is created with the `follow_up` text stored in the DB
- The orchestrator avoids duplicating already-covered topics
- Synthesis produces a new artifact that integrates old and new findings

Use this when research is complete and you want to ask a follow-on question.

### Refocus

A refocus **redirects an in-progress session**, replanning from whatever findings have already been collected.

```
GET /stream?session_id=...&refocus=Focus more on budget hostels
```

- Findings from the current session are loaded from the DB as partial results
- The orchestrator enters refocus mode and plans new tasks based on the instruction
- A new session record is created; the refocus text is not persisted to the DB

Use this when a session is running (or was just cancelled) and you want to steer it differently.

### Comparison

| | Follow-up | Refocus |
|--|-----------|---------|
| Scope | Across sessions | Within a session |
| Context loaded | All KB findings + artifact | Current session's findings only |
| Stored in DB | `sessions.follow_up` | Agent state only |
| Typical use | Extend completed research | Steer in-progress research |
