import { OrchestratorPhase } from '../lib/simulationData';

const PHASE_CONFIG: Record<OrchestratorPhase, { label: string; color: string }> = {
  thinking:    { label: 'Extended thinking',    color: 'bg-neutral-100 text-neutral-500' },
  spawning:    { label: 'Spawning agents',      color: 'bg-indigo-100 text-indigo-700' },
  evaluating:  { label: 'Evaluating findings',  color: 'bg-amber-100 text-amber-700' },
  synthesizing:{ label: 'Synthesizing report',  color: 'bg-emerald-100 text-emerald-700' },
};

export default function OrchestratorCard({ phase }: { phase: OrchestratorPhase }) {
  const { label, color } = PHASE_CONFIG[phase];

  return (
    <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-2xl px-5 py-4 mb-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Orchestrator</p>
          <p className="text-[11px] text-neutral-400">Claude Opus 4</p>
        </div>
      </div>

      <div className={`flex items-center gap-2 text-[12px] font-medium px-3 py-1.5 rounded-full transition-all duration-500 ${color}`}>
        {phase === 'thinking' && (
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
        {phase !== 'thinking' && (
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-pulse" />
        )}
        {label}
      </div>
    </div>
  );
}
