'use client';

import { useState, useEffect, useRef } from 'react';
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

function LandingView({ onSubmit }: { onSubmit: (q: string, fast: boolean) => void }) {
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

function AgentGrid({ agents, cancelled }: { agents: SubAgent[]; cancelled?: boolean }) {
  const round1 = agents.filter((a) => a.round === 1);
  const round2 = agents.filter((a) => a.round === 2);
  return (
    <>
      {round1.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex flex-col gap-3 flex-1">
            {round1.filter((_, i) => i % 2 === 0).map((a) => <SubAgentCard key={`${a.id}-${a.dimmed}`} agent={a} cancelled={cancelled} />)}
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {round1.filter((_, i) => i % 2 !== 0).map((a) => <SubAgentCard key={`${a.id}-${a.dimmed}`} agent={a} cancelled={cancelled} />)}
          </div>
        </div>
      )}
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
          <div className="flex gap-3 mb-4">
            <div className="flex flex-col gap-3 flex-1">
              {round2.filter((_, i) => i % 2 === 0).map((a) => <SubAgentCard key={`${a.id}-${a.dimmed}`} agent={a} cancelled={cancelled} />)}
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {round2.filter((_, i) => i % 2 !== 0).map((a) => <SubAgentCard key={`${a.id}-${a.dimmed}`} agent={a} cancelled={cancelled} />)}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function AgentsSection({ agents, previousAgents, cancelled }: { agents: SubAgent[]; previousAgents: SubAgent[]; cancelled?: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const allAgents = [...previousAgents, ...agents];
  const doneCount = agents.filter((a) => a.status === 'done').length;

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 mb-3 group"
      >
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-widest shrink-0 group-hover:text-neutral-600 transition-colors">
          {doneCount === agents.length && agents.length > 0 ? `${agents.length} agents done` : `${doneCount}/${agents.length} agents`}
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="transition-transform duration-300"
            style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
        <div className="flex-1 h-px bg-neutral-200" />
      </button>

      <div
        style={{
          maxHeight: expanded ? '9999px' : 0,
          overflow: 'hidden',
          opacity: expanded ? 1 : 0,
          transition: 'max-height 0.4s ease, opacity 0.3s ease',
        }}
      >
        {previousAgents.length > 0 && (
          <>
            <AgentGrid agents={previousAgents} />
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-violet-200" />
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-500 uppercase tracking-widest shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                Refocused
              </span>
              <div className="flex-1 h-px bg-violet-200" />
            </div>
          </>
        )}
        <AgentGrid agents={agents} cancelled={cancelled} />
      </div>
    </div>
  );
}

function ResearchView({
  query,
  orchestratorPhase,
  agents,
  previousAgents,
  report,
  error,
  cancelled,
  onReset,
  onStop,
  onRefocus,
}: {
  query: string;
  orchestratorPhase: OrchestratorPhase;
  agents: SubAgent[];
  previousAgents: SubAgent[];
  report: ReportData | null;
  error: string | null;
  cancelled: boolean;
  onReset: () => void;
  onStop: () => void;
  onRefocus: (instruction: string) => void;
}) {
  const isResearching = !report && !error && !cancelled;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
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
          <button
            onClick={onReset}
            className="text-[12px] font-medium bg-neutral-900 hover:bg-neutral-700 text-white px-3.5 py-1.5 rounded-lg transition-colors"
          >
            New research
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <OrchestratorCard
          phase={orchestratorPhase}
          isResearching={isResearching}
          onStop={onStop}
          onRefocus={onRefocus}
        />

        {(agents.length > 0 || previousAgents.length > 0) && (
          <AgentsSection agents={agents} previousAgents={previousAgents} cancelled={cancelled} />
        )}

        {report && <ResearchReport report={report} />}
      </div>
    </div>
  );
}

function ClarifyView({
  query,
  fast,
  onStart,
  onSkip,
}: {
  query: string;
  fast: boolean;
  onStart: (answers: { question: string; answer: string }[]) => void;
  onSkip: () => void;
}) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/research/clarify?query=${encodeURIComponent(query)}&fast=${fast}`)
      .then((r) => r.json())
      .then((data) => {
        const qs: string[] = data.questions ?? [];
        setQuestions(qs);
        setAnswers(qs.map(() => ''));
      })
      .catch(() => onSkip())
      .finally(() => setLoading(false));
  }, []);

  function handleStart() {
    const clarifications = questions.map((q, i) => ({ question: q, answer: answers[i] }));
    onStart(clarifications);
  }

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

      <div className="w-full flex flex-col gap-6" style={{ maxWidth: '600px' }}>
        <div>
          <p className="text-[13px] text-neutral-500 font-medium mb-1">Your query</p>
          <p className="text-[15px] text-neutral-800 font-semibold">{query}</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2 animate-pulse">
                <div className="h-3.5 bg-neutral-200 rounded w-3/4" />
                <div className="h-9 bg-neutral-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {questions.map((q, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-neutral-700">{q}</label>
                <input
                  type="text"
                  value={answers[i]}
                  onChange={(e) => setAnswers((prev) => prev.map((a, j) => (j === i ? e.target.value : a)))}
                  placeholder="Your answer (optional)"
                  className="px-3.5 py-2.5 text-[13px] rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all text-neutral-800 placeholder:text-neutral-400"
                />
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleStart}
              className="flex-1 py-2.5 text-[13px] font-semibold bg-neutral-900 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Start research
            </button>
            <button
              onClick={onSkip}
              className="px-5 py-2.5 text-[13px] font-medium text-neutral-500 hover:text-neutral-800 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [appPhase, setAppPhase] = useState<AppPhase>('idle');
  const [query, setQuery] = useState('');
  const [fast, setFast] = useState(false);
  const [clarifications, setClarifications] = useState<{ question: string; answer: string }[]>([]);
  const [orchestratorPhase, setOrchestratorPhase] = useState<OrchestratorPhase>('thinking');
  const [agents, setAgents] = useState<SubAgent[]>([]);
  const [previousAgents, setPreviousAgents] = useState<SubAgent[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [refocusData, setRefocusData] = useState<{ sid: string; instruction: string } | null>(null);
  const [streamVersion, setStreamVersion] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  function handleSubmit(q: string, fastMode: boolean) {
    setQuery(q);
    setFast(fastMode);
    setAgents([]);
    setReport(null);
    setError(null);
    setOrchestratorPhase('thinking');
    setAppPhase('clarifying');
  }

  function startResearch(answers: { question: string; answer: string }[]) {
    setClarifications(answers);
    setAppPhase('researching');
  }

  function handleReset() {
    esRef.current?.close();
    setAppPhase('idle');
    setQuery('');
    setClarifications([]);
    setAgents([]);
    setPreviousAgents([]);
    setReport(null);
    setError(null);
    setCancelled(false);
    setSessionId(null);
    setRefocusData(null);
    setStreamVersion(0);
  }

  function handleStop() {
    esRef.current?.close();
    setCancelled(true);
  }

  function handleRefocus(instruction: string) {
    if (!sessionId) return;
    setPreviousAgents((prev) => [...prev, ...agents.map((a) => ({ ...a, status: 'done' as const, dimmed: true }))]);
    setAgents([]);
    setOrchestratorPhase('thinking');
    setRefocusData({ sid: sessionId, instruction });
    setStreamVersion((v) => v + 1);
  }

  useEffect(() => {
    if (appPhase !== 'researching') return;

    let agentCount = 0;
    let totalSources = 0;

    const params = new URLSearchParams({ query, fast: String(fast) });
    if (clarifications.length) params.set('clarifications', JSON.stringify(clarifications));
    if (refocusData) {
      params.set('refocus', refocusData.instruction);
      params.set('session_id', refocusData.sid);
    }

    const es = new EventSource(`${API_BASE}/research/stream?${params}`);
    esRef.current = es;

    es.onmessage = (e) => {
      const event = JSON.parse(e.data);

      switch (event.type) {
        case 'session_id':
          setSessionId(event.id);
          break;

        case 'orchestrator_phase': {
          const order: OrchestratorPhase[] = ['thinking', 'spawning', 'evaluating', 'synthesizing', 'done'];
          setOrchestratorPhase((prev) => {
            const incoming: OrchestratorPhase = event.phase;
            return order.indexOf(incoming) > order.indexOf(prev) ? incoming : prev;
          });
          break;
        }

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
          setOrchestratorPhase('done');
          setAppPhase('complete');
          break;

        case 'done':
          es.close();
          break;
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [appPhase, streamVersion]);

  if (appPhase === 'idle') {
    return <LandingView onSubmit={handleSubmit} />;
  }

  if (appPhase === 'clarifying') {
    return (
      <ClarifyView
        query={query}
        fast={fast}
        onStart={startResearch}
        onSkip={() => startResearch([])}
      />
    );
  }

  return (
    <ResearchView
      query={query}
      orchestratorPhase={orchestratorPhase}
      agents={agents}
      previousAgents={previousAgents}
      report={report}
      error={error}
      cancelled={cancelled}
      onReset={handleReset}
      onStop={handleStop}
      onRefocus={handleRefocus}
    />
  );
}
