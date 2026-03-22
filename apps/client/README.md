# Client

Next.js frontend for Thread Lens. Streams research progress via SSE and renders the final artifact as styled markdown.

## Setup

```bash
npm install
npm dev        # http://localhost:3000
```

### Environment

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Research API base URL |

## Structure

```
app/
├── page.tsx                  # Main research flow (SSE stream, state machine)
├── lib/
│   ├── types.ts              # Shared types (AppPhase, SubAgent, etc.)
│   └── export.ts             # Markdown/JSON/PDF export logic
└── components/
    ├── SearchInput.tsx        # Query input with fast mode toggle
    ├── OrchestratorCard.tsx   # Orchestrator phase indicator
    ├── SubAgentCard.tsx       # Per-agent progress card
    ├── ResearchArtifact.tsx   # Markdown report renderer
    ├── FollowUpInput.tsx      # Follow-up question input
    ├── ExportButton.tsx       # Export dropdown (MD/JSON/PDF)
    ├── HistoryMenu.tsx        # Cmd+K history search modal
    ├── HistoryPanel.tsx       # Sidebar history list
    ├── ResearchSidebar.tsx    # Right sidebar (agents, sources)
    └── Toast.tsx              # Toast notification system
```

## App Phases

`idle` → `clarifying` (skipped in fast mode) → `researching` → `complete`

During `researching`, the client opens an SSE connection to `/research/stream` and reacts to events: `orchestrator_phase`, `agent_spawned`, `tool_call`, `agent_done`, `artifact_ready`, `error`.
