'use client';

import { useState } from 'react';
import { OrchestratorPhase } from '../lib/simulationData';

const PHASE_CONFIG: Record<OrchestratorPhase, { label: string; color: string }> = {
  thinking:    { label: 'Thinking',    color: 'text-neutral-400' },
  spawning:    { label: 'Spawning',    color: 'text-indigo-500' },
  evaluating:  { label: 'Evaluating', color: 'text-amber-500' },
  synthesizing:{ label: 'Synthesizing', color: 'text-violet-500' },
  done:        { label: 'Complete',   color: 'text-emerald-500' },
};

export default function OrchestratorCard({
  phase,
  isResearching,
  onStop,
  onRefocus,
}: {
  phase: OrchestratorPhase;
  isResearching?: boolean;
  onStop?: () => void;
  onRefocus?: (instruction: string) => void;
}) {
  const { label, color } = PHASE_CONFIG[phase];
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
    <div className="bg-white border border-neutral-200 rounded-2xl mb-5 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-neutral-900">Orchestrator</p>
          <div className={`flex items-center gap-1.5 text-[12px] font-medium transition-all duration-500 ${color}`}>
            {phase === 'thinking' && (
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
            {phase === 'done' && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
            {phase !== 'thinking' && phase !== 'done' && (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            )}
            {label}
          </div>
        </div>

        {isResearching && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowRefocus((v) => !v); setRefocusValue(''); }}
              className="text-[11px] font-semibold bg-violet-600 hover:bg-violet-700 text-white px-2.5 py-1 rounded-lg transition-colors"
            >
              Refocus
            </button>
            <button
              onClick={onStop}
              className="text-[11px] font-medium text-red-400 hover:text-red-600 border border-red-200 hover:border-red-300 px-2.5 py-1 rounded-lg transition-colors"
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {showRefocus && (
        <div className="px-5 pb-4 flex items-center gap-2 border-t border-neutral-100 pt-3">
          <input
            autoFocus
            type="text"
            value={refocusValue}
            onChange={(e) => setRefocusValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitRefocus(); if (e.key === 'Escape') setShowRefocus(false); }}
            placeholder="e.g. focus on budget options, ignore luxury"
            className="flex-1 px-3 py-1.5 text-[12px] rounded-lg border border-violet-200 bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-neutral-800 placeholder:text-neutral-400 transition-all"
          />
          <button
            onClick={submitRefocus}
            disabled={!refocusValue.trim()}
            className="text-[11px] font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Go
          </button>
          <button
            onClick={() => setShowRefocus(false)}
            className="text-[11px] font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
