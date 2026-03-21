'use client';

import { useState } from 'react';
import { OrchestratorPhase } from '../lib/types';

const PHASE_CONFIG: Record<OrchestratorPhase, { label: string; color: string; glow: string }> = {
  thinking:     { label: 'Thinking',     color: 'rgba(255,255,255,0.4)',  glow: 'rgba(255,255,255,0.05)' },
  spawning:     { label: 'Spawning',     color: 'rgba(129,140,248,0.9)', glow: 'rgba(99,102,241,0.15)'  },
  evaluating:   { label: 'Evaluating',   color: 'rgba(251,191,36,0.9)',  glow: 'rgba(251,191,36,0.1)'   },
  synthesizing: { label: 'Synthesizing', color: 'rgba(192,132,252,0.9)', glow: 'rgba(168,85,247,0.12)'  },
  done:         { label: 'Complete',     color: 'rgba(52,211,153,0.9)',  glow: 'rgba(52,211,153,0.1)'   },
};

export default function OrchestratorCard({
  phase,
  isResearching,
  cancelled,
  onStop,
  onRefocus,
}: {
  phase: OrchestratorPhase;
  isResearching?: boolean;
  cancelled?: boolean;
  onStop?: () => void;
  onRefocus?: (instruction: string) => void;
}) {
  const config = cancelled
    ? { label: 'Cancelled', color: 'rgba(248,113,113,0.85)', glow: 'rgba(239,68,68,0.1)' }
    : PHASE_CONFIG[phase];

  const [showRefocus, setShowRefocus] = useState(false);
  const [refocusValue, setRefocusValue] = useState('');

  function submitRefocus() {
    const text = refocusValue.trim();
    if (!text) return;
    setRefocusValue('');
    setShowRefocus(false);
    onRefocus?.(text);
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        marginBottom: '20px',
        overflow: 'hidden',
        boxShadow: `0 4px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Icon */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 16px rgba(99,102,241,0.4)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'white' }}>
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>

          <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Orchestrator</span>

          {/* Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: config.color,
              background: config.glow,
              padding: '3px 10px',
              borderRadius: '20px',
              transition: 'all 0.5s ease',
            }}
          >
            {cancelled ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : phase === 'thinking' ? (
              <span style={{ display: 'flex', gap: '3px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: 'bounce 1.2s infinite', animationDelay: '0ms' }} />
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: 'bounce 1.2s infinite', animationDelay: '150ms' }} />
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: 'bounce 1.2s infinite', animationDelay: '300ms' }} />
              </span>
            ) : phase === 'done' ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            )}
            {config.label}
          </div>
        </div>

        {isResearching && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => { setShowRefocus((v) => !v); setRefocusValue(''); }}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.3)',
                color: 'rgba(192,132,252,0.9)',
                padding: '5px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; }}
            >
              Refocus
            </button>
            <button
              onClick={onStop}
              style={{
                fontSize: '11px',
                fontWeight: 500,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'rgba(248,113,113,0.85)',
                padding: '5px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {showRefocus && (
        <div
          style={{
            padding: '12px 20px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <input
            autoFocus
            type="text"
            value={refocusValue}
            onChange={(e) => setRefocusValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitRefocus(); if (e.key === 'Escape') setShowRefocus(false); }}
            placeholder="e.g. focus on budget options, ignore luxury"
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(139,92,246,0.3)',
              background: 'rgba(139,92,246,0.07)',
              color: 'rgba(255,255,255,0.8)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            className="placeholder:text-white/25 focus:border-violet-400/50"
          />
          <button
            onClick={submitRefocus}
            disabled={!refocusValue.trim()}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              background: refocusValue.trim() ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : 'rgba(255,255,255,0.05)',
              color: refocusValue.trim() ? 'white' : 'rgba(255,255,255,0.25)',
              padding: '7px 14px',
              borderRadius: '8px',
              cursor: refocusValue.trim() ? 'pointer' : 'not-allowed',
              border: 'none',
              transition: 'background 0.15s',
              boxShadow: refocusValue.trim() ? '0 2px 12px rgba(124,58,237,0.4)' : 'none',
            }}
          >
            Go
          </button>
          <button
            onClick={() => setShowRefocus(false)}
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'transparent', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
