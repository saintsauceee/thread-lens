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
  ToolCallStatus,
  ResearchReport as ReportData,
  buildAgents,
  generateReport,
} from './lib/simulationData';

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

        {/* Spacer when no round 2 yet */}
        {round2.length === 0 && <div className="mb-8" />}

        {/* Report */}
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

  function addAgent(agent: SubAgent) {
    setAgents((prev) => [...prev, { ...agent, toolCalls: agent.toolCalls.map((tc) => ({ ...tc })) }]);
  }

  function updateToolCall(agentId: number, tcId: number, status: ToolCallStatus) {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, toolCalls: a.toolCalls.map((tc) => (tc.id === tcId ? { ...tc, status } : tc)) }
          : a
      )
    );
  }

  function completeAgent(agentId: number, sourceCount: number) {
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status: 'done', sourceCount } : a))
    );
  }

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

    const all = buildAgents(query);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    // ── Orchestrator thinks ─────────────────────────────────────────────────
    t(1600, () => setOrchestratorPhase('spawning'));

    // ── Round 1: 4 agents, staggered 300ms apart ────────────────────────────
    // Each agent: tc[0] active on spawn, tc[1] +300ms, tc[2] +600ms
    // Each tc done: spawn + tcIndex*300 + 1200ms
    // Agent done with last tc

    // Agent 0 — spawns at 1900
    t(1900, () => { addAgent({ ...all[0], toolCalls: all[0].toolCalls.map((tc, i) => ({ ...tc, status: i === 0 ? 'active' : 'pending' })) }); });
    t(2200, () => updateToolCall(0, 1, 'active'));
    t(2500, () => updateToolCall(0, 2, 'active'));
    t(3100, () => updateToolCall(0, 0, 'done'));
    t(3400, () => updateToolCall(0, 1, 'done'));
    t(3700, () => { updateToolCall(0, 2, 'done'); completeAgent(0, 14); });

    // Agent 1 — spawns at 2200
    t(2200, () => { addAgent({ ...all[1], toolCalls: all[1].toolCalls.map((tc, i) => ({ ...tc, status: i === 0 ? 'active' : 'pending' })) }); });
    t(2500, () => updateToolCall(1, 1, 'active'));
    t(2800, () => updateToolCall(1, 2, 'active'));
    t(3400, () => updateToolCall(1, 0, 'done'));
    t(3700, () => updateToolCall(1, 1, 'done'));
    t(4000, () => { updateToolCall(1, 2, 'done'); completeAgent(1, 9); });

    // Agent 2 — spawns at 2500
    t(2500, () => { addAgent({ ...all[2], toolCalls: all[2].toolCalls.map((tc, i) => ({ ...tc, status: i === 0 ? 'active' : 'pending' })) }); });
    t(2800, () => updateToolCall(2, 1, 'active'));
    t(3100, () => updateToolCall(2, 2, 'active'));
    t(3700, () => updateToolCall(2, 0, 'done'));
    t(4000, () => updateToolCall(2, 1, 'done'));
    t(4300, () => { updateToolCall(2, 2, 'done'); completeAgent(2, 12); });

    // Agent 3 — spawns at 2800
    t(2800, () => { addAgent({ ...all[3], toolCalls: all[3].toolCalls.map((tc, i) => ({ ...tc, status: i === 0 ? 'active' : 'pending' })) }); });
    t(3100, () => updateToolCall(3, 1, 'active'));
    t(3400, () => updateToolCall(3, 2, 'active'));
    t(4000, () => updateToolCall(3, 0, 'done'));
    t(4300, () => updateToolCall(3, 1, 'done'));
    t(4600, () => { updateToolCall(3, 2, 'done'); completeAgent(3, 7); });

    // ── Evaluation ──────────────────────────────────────────────────────────
    t(4800, () => setOrchestratorPhase('evaluating'));
    t(5300, () => setOrchestratorPhase('spawning'));

    // ── Round 2: 2 agents ───────────────────────────────────────────────────

    // Agent 4 — spawns at 5400
    t(5400, () => { addAgent({ ...all[4], toolCalls: all[4].toolCalls.map((tc, i) => ({ ...tc, status: i === 0 ? 'active' : 'pending' })) }); });
    t(5700, () => updateToolCall(4, 1, 'active'));
    t(6000, () => updateToolCall(4, 2, 'active'));
    t(6600, () => updateToolCall(4, 0, 'done'));
    t(6900, () => updateToolCall(4, 1, 'done'));
    t(7200, () => { updateToolCall(4, 2, 'done'); completeAgent(4, 11); });

    // Agent 5 — spawns at 5700
    t(5700, () => { addAgent({ ...all[5], toolCalls: all[5].toolCalls.map((tc, i) => ({ ...tc, status: i === 0 ? 'active' : 'pending' })) }); });
    t(6000, () => updateToolCall(5, 1, 'active'));
    t(6300, () => updateToolCall(5, 2, 'active'));
    t(6900, () => updateToolCall(5, 0, 'done'));
    t(7200, () => updateToolCall(5, 1, 'done'));
    t(7500, () => { updateToolCall(5, 2, 'done'); completeAgent(5, 8); });

    // ── Synthesis ───────────────────────────────────────────────────────────
    t(7600, () => setOrchestratorPhase('synthesizing'));
    t(9000, () => {
      setReport(generateReport(query));
      setAppPhase('complete');
    });

    return () => timers.forEach(clearTimeout);
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
