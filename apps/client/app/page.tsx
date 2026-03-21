'use client';

import { useState, useEffect, useRef } from 'react';
import SearchInput from './components/SearchInput';
import OrchestratorCard from './components/OrchestratorCard';
import SubAgentCard from './components/SubAgentCard';
import ResearchArtifact from './components/ResearchArtifact';
import FollowUpInput from './components/FollowUpInput';
import HistoryMenu from './components/HistoryMenu';
import ToastContainer from './components/Toast';
import {
  AppPhase,
  OrchestratorPhase,
  SubAgent,
  ResearchArtifact as ArtifactData,
  HistoryEntry,
} from './lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ── Animated background ──────────────────────────────────────────────────────

function BackgroundEffects() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: '-8%', left: '8%',
        width: '650px', height: '650px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'orb-drift-1 30s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-12%', right: '3%',
        width: '550px', height: '550px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'orb-drift-2 25s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: '45%', left: '55%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)',
        filter: 'blur(80px)',
        animation: 'orb-drift-3 35s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
    </div>
  );
}

// ── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({
  onOpenHistory,
  onNew,
  sticky,
}: {
  onOpenHistory: () => void;
  onNew?: () => void;
  sticky?: boolean;
}) {
  return (
    <nav style={{
      position: sticky ? 'sticky' : 'absolute',
      top: 0, left: 0, right: 0,
      padding: '14px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      zIndex: 20,
      ...(sticky ? {
        background: 'rgba(7,8,14,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      } : {}),
    }}>
      {/* Left — spacer */}
      <div />

      {/* Right — actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onNew && (
          <button
            onClick={onNew}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 14px', borderRadius: '10px',
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(167,139,250,0.4)',
              color: 'rgba(216,201,255,0.9)',
              cursor: 'pointer', transition: 'background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s',
              fontSize: '12px', fontWeight: 600,
              boxShadow: '0 0 12px rgba(139,92,246,0.08)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; e.currentTarget.style.color = 'rgba(196,181,253,1)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.45)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(139,92,246,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; e.currentTarget.style.color = 'rgba(196,181,253,0.85)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(139,92,246,0.08)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </button>
        )}
        <button
          onClick={onOpenHistory}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '7px 14px', borderRadius: '10px',
            background: 'rgba(250,204,21,0.04)',
            border: '1px solid rgba(250,204,21,0.25)',
            color: 'rgba(250,204,21,0.7)',
            cursor: 'pointer', transition: 'background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s',
            fontSize: '12px',
            boxShadow: '0 0 12px rgba(250,204,21,0.08)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,204,21,0.1)'; e.currentTarget.style.color = 'rgba(250,204,21,0.95)'; e.currentTarget.style.borderColor = 'rgba(250,204,21,0.45)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(250,204,21,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,204,21,0.04)'; e.currentTarget.style.color = 'rgba(250,204,21,0.7)'; e.currentTarget.style.borderColor = 'rgba(250,204,21,0.25)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(250,204,21,0.08)'; }}
        >
          <kbd style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.15)', padding: '2px 6px', borderRadius: '5px', color: 'rgba(250,204,21,0.8)' }}>⌘K</kbd>
          <span style={{ fontWeight: 500 }}>History</span>
        </button>
      </div>
    </nav>
  );
}

// ── Landing ──────────────────────────────────────────────────────────────────

function LandingView({
  onSubmit,
  onOpenHistory,
}: {
  onSubmit: (q: string, fast: boolean) => void;
  onOpenHistory: () => void;
}) {
  const glowRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent) {
    if (glowRef.current) {
      glowRef.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
    }
  }

  return (
    <div
      style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', zIndex: 1 }}
      onMouseMove={handleMouseMove}
    >
      {/* Mouse-reactive ambient glow */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none', zIndex: 0,
          willChange: 'transform',
        }}
      />

      <TopBar onOpenHistory={onOpenHistory} />

      {/* Hero */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '48px', padding: '0 24px',
      }}>
        {/* Title + subtitle */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          {/* Glow behind title */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -55%)',
            width: '500px', height: '140px', borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.06) 50%, transparent 75%)',
            filter: 'blur(40px)', pointerEvents: 'none',
            animation: 'glow-pulse 5s ease-in-out infinite',
          }} />
          <h1 style={{
            position: 'relative',
            fontSize: '52px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1,
            color: 'rgba(255,255,255,0.88)',
            margin: 0,
          }}>
            The best answer is<br />
            <span style={{
              backgroundImage: 'linear-gradient(90deg, #a5b4fc, #c084fc, #818cf8, #a5b4fc)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 6s linear infinite',
            }}>47 comments deep</span>
            <span style={{ color: 'rgba(250,204,21,0.6)' }}>.</span>
          </h1>
        </div>

        {/* Search */}
        <div style={{ width: '100%', maxWidth: '640px' }}>
          <SearchInput onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
}

// ── Agent layout ─────────────────────────────────────────────────────────────

function AgentGrid({ agents, cancelled }: { agents: SubAgent[]; cancelled?: boolean }) {
  const round1 = agents.filter((a) => a.round === 1);
  const round2 = agents.filter((a) => a.round === 2);
  return (
    <>
      {round1.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {round1.filter((_, i) => i % 2 === 0).map((a) => <SubAgentCard key={`${a.id}-${a.dimmed}`} agent={a} cancelled={cancelled} />)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {round1.filter((_, i) => i % 2 !== 0).map((a) => <SubAgentCard key={`${a.id}-${a.dimmed}`} agent={a} cancelled={cancelled} />)}
          </div>
        </div>
      )}
      {round2.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
              </svg>
              Expanded research
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {round2.filter((_, i) => i % 2 === 0).map((a) => <SubAgentCard key={`${a.id}-${a.dimmed}`} agent={a} cancelled={cancelled} />)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {round2.filter((_, i) => i % 2 !== 0).map((a) => <SubAgentCard key={`${a.id}-${a.dimmed}`} agent={a} cancelled={cancelled} />)}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function AgentsSection({ agents, previousAgents, cancelled, isComplete }: { agents: SubAgent[]; previousAgents: SubAgent[]; cancelled?: boolean; isComplete?: boolean }) {
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null);
  const expanded = userExpanded ?? !isComplete;
  const doneCount = agents.filter((a) => a.status === 'done').length;

  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        onClick={() => setUserExpanded(!expanded)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', background: 'transparent', cursor: 'pointer', border: 'none' }}
      >
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
        <span
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', flexShrink: 0, transition: 'color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; }}
        >
          {doneCount === agents.length && agents.length > 0 ? `${agents.length} agents done` : `${doneCount}/${agents.length} agents`}
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'transform 0.3s', transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
      </button>

      <div style={{
        display: 'grid',
        gridTemplateRows: expanded ? '1fr' : '0fr',
        opacity: expanded ? 1 : 0,
        transition: 'grid-template-rows 0.35s ease, opacity 0.25s ease',
      }}>
        <div style={{ minHeight: 0, overflow: 'hidden' }}>
          {previousAgents.length > 0 && (
            <>
              <AgentGrid agents={previousAgents} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(139,92,246,0.2)' }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 700, color: 'rgba(192,132,252,0.6)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                  Refocused
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(139,92,246,0.2)' }} />
              </div>
            </>
          )}
          <AgentGrid agents={agents} cancelled={cancelled} />
        </div>
      </div>
    </div>
  );
}

// ── Research view ────────────────────────────────────────────────────────────

function ResearchView({
  orchestratorPhase,
  agents,
  previousAgents,
  artifact,
  cancelled,
  query,
  kbId,
  activeStatus,
  onReset,
  onStop,
  onRefocus,
  onFollowUp,
  onOpenHistory,
}: {
  orchestratorPhase: OrchestratorPhase;
  agents: SubAgent[];
  previousAgents: SubAgent[];
  artifact: ArtifactData | null;
  cancelled: boolean;
  query: string;
  kbId: string | null;
  activeStatus: 'running' | 'cancelled' | undefined;
  onReset: () => void;
  onStop: () => void;
  onRefocus: (instruction: string) => void;
  onFollowUp: (question: string) => void;
  onOpenHistory: () => void;
}) {
  const isResearching = activeStatus === 'running';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      <TopBar onOpenHistory={onOpenHistory} onNew={onReset} sticky />

      <div style={{ flex: 1, maxWidth: '880px', margin: '0 auto', width: '100%', padding: '28px 40px' }}>
        <OrchestratorCard
          phase={orchestratorPhase}
          isResearching={isResearching}
          cancelled={cancelled}
          onStop={onStop}
          onRefocus={onRefocus}
        />

        {(agents.length > 0 || previousAgents.length > 0) && (
          <AgentsSection agents={agents} previousAgents={previousAgents} cancelled={cancelled} isComplete={!!artifact} />
        )}

        {artifact && <ResearchArtifact artifact={artifact} query={kbId ? query : undefined} kbId={kbId ?? undefined} />}
        {artifact && !isResearching && <FollowUpInput onSubmit={onFollowUp} />}
        {!artifact && !isResearching && (
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>No report was generated.</p>
        )}
      </div>
    </div>
  );
}

// ── Clarify view ─────────────────────────────────────────────────────────────

function ClarifyView({
  query,
  fast,
  onStart,
  onSkip,
  onNew,
  onOpenHistory,
}: {
  query: string;
  fast: boolean;
  onStart: (answers: { question: string; answer: string }[]) => void;
  onSkip: () => void;
  onNew: () => void;
  onOpenHistory: () => void;
}) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stale = false;
    fetch(`${API_BASE}/research/clarify?query=${encodeURIComponent(query)}&fast=${fast}`)
      .then((r) => r.json())
      .then((data) => {
        if (stale) return;
        const qs: string[] = data.questions ?? [];
        setQuestions(qs);
        setAnswers(qs.map(() => ''));
      })
      .catch(() => { if (!stale) onSkip(); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, []);

  function handleStart() {
    const clarifications = questions.map((q, i) => ({ question: q, answer: answers[i] }));
    onStart(clarifications);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      <TopBar onOpenHistory={onOpenHistory} onNew={onNew} sticky />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '0 24px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '-40px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(99,102,241,0.35), 0 8px 32px rgba(0,0,0,0.5)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '8px' }}>Your query</p>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, lineHeight: 1.4 }}>{query}</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 1 - i * 0.2 }}>
                  <div style={{ height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', width: '60%', animation: 'pulse 2s infinite' }} />
                  <div style={{ height: '40px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', animation: 'pulse 2s infinite', animationDelay: `${i * 200}ms` }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {questions.map((q, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{q}</label>
                  <input
                    type="text"
                    value={answers[i]}
                    onChange={(e) => setAnswers((prev) => prev.map((a, j) => (j === i ? e.target.value : a)))}
                    placeholder="Your answer (optional)"
                    style={{
                      padding: '10px 14px', fontSize: '13px', borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.8)', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    className="placeholder:text-white/20 focus:border-indigo-500/40"
                    onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button
                onClick={answers.some((a) => a.trim()) ? handleStart : onSkip}
                style={{
                  flex: 1, padding: '11px', fontSize: '13px', fontWeight: 700,
                  background: answers.some((a) => a.trim())
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(255,255,255,0.05)',
                  color: answers.some((a) => a.trim()) ? 'white' : 'rgba(255,255,255,0.4)',
                  borderRadius: '10px', cursor: 'pointer',
                  border: answers.some((a) => a.trim()) ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.2s',
                  boxShadow: answers.some((a) => a.trim()) ? '0 4px 20px rgba(99,102,241,0.35)' : 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {answers.some((a) => a.trim()) ? 'Start research' : 'Skip'}
              </button>
              <button
                onClick={onNew}
                style={{
                  padding: '11px 20px', fontSize: '13px', fontWeight: 500,
                  color: 'rgba(248,113,113,0.7)', background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
                  cursor: 'pointer', transition: 'color 0.15s, background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(248,113,113,0.95)'; e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(248,113,113,0.7)'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [appPhase, setAppPhase] = useState<AppPhase>('idle');
  const [query, setQuery] = useState('');
  const [fast, setFast] = useState(false);
  const [clarifications, setClarifications] = useState<{ question: string; answer: string }[]>([]);
  const [orchestratorPhase, setOrchestratorPhase] = useState<OrchestratorPhase>('thinking');
  const [agents, setAgents] = useState<SubAgent[]>([]);
  const [previousAgents, setPreviousAgents] = useState<SubAgent[]>([]);
  const [artifact, setArtifact] = useState<ArtifactData | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [kbId, setKbId] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [refocusData, setRefocusData] = useState<{ sid: string; instruction: string } | null>(null);
  const [streamVersion, setStreamVersion] = useState(0);
  const [historyMenuOpen, setHistoryMenuOpen] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setHistoryMenuOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function handleHistorySelect(entry: HistoryEntry) {
    esRef.current?.close();
    try {
      const [kbRes, agentsRes] = await Promise.all([
        fetch(`${API_BASE}/research/kb/${entry.id}`),
        fetch(`${API_BASE}/research/kb/${entry.id}/agents`),
      ]);
      if (!kbRes.ok) return;
      const kb = await kbRes.json();
      const agentsData = agentsRes.ok ? await agentsRes.json() : { agents: [], agentCount: 0, sourceCount: 0, durationSec: null };

      const wasCancelled = kb.status === 'cancelled';
      setQuery(kb.query);
      setKbId(kb.id);
      setAgents(agentsData.agents.map((a: { id: number; task: string; round: 1 | 2; sourceCount: number | null; status: 'done' }) => ({
        id: a.id,
        task: a.task,
        status: 'done' as const,
        toolCalls: [],
        sourceCount: a.sourceCount,
        round: a.round,
      })));
      setPreviousAgents([]);
      setCancelled(wasCancelled);
      setOrchestratorPhase('done');
      setArtifact(kb.artifact ? {
        rawMarkdown: kb.artifact,
        agentCount: agentsData.agentCount,
        sourceCount: agentsData.sourceCount,
        durationSec: agentsData.durationSec,
      } : null);
      setAppPhase('complete');
    } catch {}
  }

  function handleSubmit(q: string, fastMode: boolean) {
    setQuery(q);
    setFast(fastMode);
    setAgents([]);
    setArtifact(null);
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
    setArtifact(null);
    setCancelled(false);
    setSessionId(null);
    setKbId(null);
    setFollowUp(null);
    setRefocusData(null);
    setStreamVersion(0);
    localStorage.removeItem('thread_lens_kb');
  }

  function handleStop() {
    esRef.current?.close();
    setCancelled(true);
    if (sessionId) {
      fetch(`${API_BASE}/research/session/${sessionId}/cancel`, { method: 'POST' }).catch(() => {});
    }
  }

  function handleFollowUp(question: string) {
    setPreviousAgents((prev) => [...prev, ...agents.map((a) => ({ ...a, status: 'done' as const, dimmed: true }))]);
    setAgents([]);
    setArtifact(null);
    setCancelled(false);
    setOrchestratorPhase('thinking');
    setFollowUp(question);
    setStreamVersion((v) => v + 1);
    setAppPhase('researching');
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
    if (kbId && followUp) {
      params.set('kb_id', kbId);
      params.set('follow_up', followUp);
    }

    const es = new EventSource(`${API_BASE}/research/stream?${params}`);
    esRef.current = es;

    es.onmessage = (e) => {
      const event = JSON.parse(e.data);

      switch (event.type) {
        case 'kb_id':
          setKbId(event.id);
          localStorage.setItem('thread_lens_kb', JSON.stringify({ id: event.id, query }));
          break;

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

        case 'artifact_ready':
          setArtifact({
            rawMarkdown: event.artifact,
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

  // ── Render ──

  const openHistory = () => setHistoryMenuOpen(true);

  if (appPhase === 'idle') {
    return (
      <>
        <BackgroundEffects />
        <HistoryMenu open={historyMenuOpen} onClose={() => setHistoryMenuOpen(false)} onSelect={handleHistorySelect} currentKbId={kbId} />
        <LandingView onSubmit={handleSubmit} onOpenHistory={openHistory} />
        <ToastContainer />
      </>
    );
  }

  if (appPhase === 'clarifying') {
    return (
      <>
        <BackgroundEffects />
        <HistoryMenu open={historyMenuOpen} onClose={() => setHistoryMenuOpen(false)} onSelect={handleHistorySelect} currentKbId={kbId} />
        <ClarifyView
          query={query}
          fast={fast}
          onStart={startResearch}
          onSkip={() => startResearch([])}
          onNew={handleReset}
          onOpenHistory={openHistory}
        />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <BackgroundEffects />
      <HistoryMenu
        open={historyMenuOpen}
        onClose={() => setHistoryMenuOpen(false)}
        onSelect={handleHistorySelect}
        currentKbId={kbId}
      />
      <ResearchView
        orchestratorPhase={orchestratorPhase}
        agents={agents}
        previousAgents={previousAgents}
        artifact={artifact}
        cancelled={cancelled}
        query={query}
        kbId={kbId}
        activeStatus={cancelled ? 'cancelled' : appPhase === 'researching' ? 'running' : undefined}
        onReset={handleReset}
        onStop={handleStop}
        onRefocus={handleRefocus}
        onFollowUp={handleFollowUp}
        onOpenHistory={openHistory}
      />
      <ToastContainer />
    </>
  );
}
