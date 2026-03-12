'use client';

import { useState, useEffect } from 'react';
import SearchInput from './components/SearchInput';
import OrchestratorCard from './components/OrchestratorCard';
import SubAgentCard from './components/SubAgentCard';
import ResearchReport from './components/ResearchReport';
import {
  AppPhase,
  OrchestratorPhase,
  SubAgent,
  ResearchReport as ReportData,
} from './lib/simulationData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ── Landing ───────────────────────────────────────────────────────────────────

function LandingView({ onSubmit }: { onSubmit: (q: string) => void }) {
  return (
    <div className="h-screen bg-white flex flex-col items-center justify-center gap-8 px-4">
      <div className="relative">
        <div
          className="absolute -inset-10 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)' }}
        />
        <div
          className="relative w-[72px] h-[72px] rounded-[22px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"
          style={{ boxShadow: '0 0 48px rgba(99,102,241,0.45), 0 8px 32px rgba(0,0,0,0.3)' }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
      </div>

      <h1
        className="text-[28px] font-semibold tracking-tight bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(135deg, #4338ca 0%, #1e1b4b 45%, #6d28d9 100%)' }}
      >
        What do you want?
      </h1>

      <div className="w-full" style={{ maxWidth: '720px' }}>
        <SearchInput onSubmit={onSubmit} />
      </div>
    </div>
  );
}

// ── Research view ─────────────────────────────────────────────────────────────

function ResearchView({
  query,
  orchestratorPhase,
  agents,
  report,
  onReset,
}: {
  query: string;
  orchestratorPhase: OrchestratorPhase;
  agents: SubAgent[];
  report: ReportData | null;
  onReset: () => void;
}) {
  const round1 = agents.filter((a) => a.round === 1);
  const round2 = agents.filter((a) => a.round === 2);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-neutral-100 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <p className="text-sm text-neutral-800 font-semibold truncate">{query}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {!report ? (
            <div className="flex items-center gap-2 text-[12px] text-indigo-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Researching…
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[12px] text-emerald-600 font-medium">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Complete
            </div>
          )}
          <button
            onClick={onReset}
            className="text-[12px] font-medium bg-neutral-900 hover:bg-neutral-700 text-white px-3.5 py-1.5 rounded-lg transition-colors"
          >
            New research
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <OrchestratorCard phase={orchestratorPhase} />

        {/* Round 1 agents */}
        {round1.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {round1.map((a) => <SubAgentCard key={a.id} agent={a} />)}
          </div>
        )}

        {/* Round 2 agents */}
        {round2.length > 0 && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-neutral-200" />
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-widest shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
                </svg>
                Expanded research
              </span>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {round2.map((a) => <SubAgentCard key={a.id} agent={a} />)}
            </div>
          </>
        )}

        {round2.length === 0 && <div className="mb-8" />}

        {report && <ResearchReport report={report} />}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [appPhase, setAppPhase] = useState<AppPhase>('idle');
  const [query, setQuery] = useState('');
  const [orchestratorPhase, setOrchestratorPhase] = useState<OrchestratorPhase>('thinking');
  const [agents, setAgents] = useState<SubAgent[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);

  function handleSubmit(q: string) {
    setQuery(q);
    setAgents([]);
    setReport(null);
    setOrchestratorPhase('thinking');
    setAppPhase('researching');
  }

  function handleReset() {
    setAppPhase('idle');
    setQuery('');
    setAgents([]);
    setReport(null);
  }

  useEffect(() => {
    if (appPhase !== 'researching') return;

    let agentCount = 0;
    let totalSources = 0;

    const es = new EventSource(`${API_BASE}/research/stream?query=${encodeURIComponent(query)}`);

    es.onmessage = (e) => {
      const event = JSON.parse(e.data);

      switch (event.type) {
        case 'orchestrator_phase':
          setOrchestratorPhase(event.phase);
          break;

        case 'agent_spawned':
          agentCount++;
          setAgents((prev) => [
            ...prev,
            {
              id: event.id,
              task: event.task,
              status: 'active',
              toolCalls: [],
              sourceCount: null,
              round: event.round,
            },
          ]);
          break;

        case 'tool_call':
          setAgents((prev) =>
            prev.map((a) => {
              if (a.id !== event.agentId) return a;
              const exists = a.toolCalls.find((tc) => tc.id === event.toolId);
              if (!exists) {
                return {
                  ...a,
                  toolCalls: [...a.toolCalls, { id: event.toolId, label: event.label, status: event.status }],
                };
              }
              return {
                ...a,
                toolCalls: a.toolCalls.map((tc) =>
                  tc.id === event.toolId ? { ...tc, status: event.status } : tc
                ),
              };
            })
          );
          break;

        case 'agent_done':
          totalSources += event.sourceCount ?? 0;
          setAgents((prev) =>
            prev.map((a) =>
              a.id === event.agentId ? { ...a, status: 'done', sourceCount: event.sourceCount } : a
            )
          );
          break;

        case 'report_ready':
          setReport({
            rawMarkdown: event.report,
            agentCount,
            sourceCount: totalSources,
            durationSec: event.durationSec,
          });
          setAppPhase('complete');
          break;

        case 'done':
          es.close();
          break;
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [appPhase]);

  if (appPhase === 'idle') {
    return <LandingView onSubmit={handleSubmit} />;
  }

  return (
    <ResearchView
      query={query}
      orchestratorPhase={orchestratorPhase}
      agents={agents}
      report={report}
      onReset={handleReset}
    />
  );
}
