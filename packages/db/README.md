# DB

Shared async SQLite database layer for Thread Lens. Used by the research API to persist knowledge bases, sessions, agents, and findings.

## Setup

```bash
pip install -e .
```

### Environment

| Variable | Default | Description |
|---|---|---|
| `THREAD_LENS_DB_PATH` | `thread_lens.db` | Path to the SQLite database file |

The schema is auto-created on first call to `init_db()`.

## Schema

```
knowledge_bases   # Research queries + final markdown artifact
├── sessions      # Individual research runs (per KB, supports follow-ups)
│   ├── agents    # Spawned sub-agents with task + round + source count
│   └── findings  # Per-agent results (topic, findings text, source URLs)
```

Session status is derived, not stored: `artifact != ''` → complete, `cancelled_at IS NOT NULL` → cancelled, else incomplete.

## API

```python
from thread_lens_db import get_db, init_db

# Knowledge bases
create_kb(db, query) → dict
get_kb(db, kb_id) → dict | None
list_kbs(db) → list[dict]
delete_kb(db, kb_id)
update_artifact(db, kb_id, artifact)

# Sessions
create_session(db, kb_id, follow_up?) → dict
complete_session(db, session_id, duration_sec)
cancel_session(db, session_id)
get_sessions(db, kb_id) → list[dict]

# Agents
save_agent(db, kb_id, session_id, agent_index, task, round)
update_agent_source_count(db, session_id, agent_index, count)
get_kb_agents(db, kb_id) → list[dict]

# Findings
append_findings(db, kb_id, session_id, results)
get_findings(db, kb_id) → list[dict]
get_session_findings(db, session_id) → list[dict]
```
