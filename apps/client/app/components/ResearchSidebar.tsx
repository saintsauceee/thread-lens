'use client';

import { useEffect, useState } from 'react';
import { HistoryEntry } from '../lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

export default function ResearchSidebar({
  currentKbId,
  onSelect,
  onNew,
  refreshKey,
  pendingQuery,
  activeIsRunning,
}: {
  currentKbId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onNew: () => void;
  refreshKey: number;
  pendingQuery?: string;
  activeIsRunning?: boolean;
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/research/kbs`)
      .then((r) => r.json())
      .then((data: { id: string; query: string; updated_at: string }[]) => {
        setEntries(data.map((d) => ({ id: d.id, query: d.query, updatedAt: d.updated_at })));
      })
      .catch(() => {});
  }, [refreshKey]);

  return (
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 flex flex-col bg-white" style={{ borderRight: '1px solid #ebebeb' }}>

      {/* New button */}
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-[11px] font-medium text-neutral-400">History</span>
        <button onClick={onNew} className="text-neutral-300 hover:text-neutral-600 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-2" style={{ scrollbarWidth: 'none' }}>
        {pendingQuery && (
          <div
            className="px-2 py-2 rounded-md mb-1 flex flex-col gap-0.5"
            style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}
          >
            <span className="text-[12.5px] leading-snug truncate text-amber-900 font-medium">{pendingQuery}</span>
            <span className="flex items-center gap-1 text-[11px] text-amber-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              preparing
            </span>
          </div>
        )}
        {entries.length === 0 && !pendingQuery ? (
          <p className="text-[12px] text-neutral-300 px-2 py-1">No research yet</p>
        ) : (
          entries.map((entry) => {
            const active = entry.id === currentKbId;
            return (
              <button
                key={entry.id}
                onClick={() => onSelect(entry)}
                className={`w-full text-left px-2 py-2 rounded-md mb-px flex flex-col gap-0.5 transition-colors ${active ? 'bg-indigo-50' : 'hover:bg-neutral-50'}`}
                style={{ border: `1px solid ${active && activeIsRunning ? '#a5b4fc' : 'transparent'}` }}
              >
                <span className={`text-[12.5px] leading-snug truncate ${active ? 'text-indigo-700 font-medium' : 'text-neutral-600'}`}>
                  {entry.query}
                </span>
                {active && activeIsRunning ? (
                  <span className="flex items-center gap-1 text-[11px] text-indigo-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />
                    in progress
                  </span>
                ) : (
                  <span className={`text-[11px] ${active ? 'text-indigo-400' : 'text-neutral-300'}`}>
                    {timeAgo(entry.updatedAt)}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3.5">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className="flex items-center gap-1.5 text-neutral-300 hover:text-neutral-500 transition-colors"
        >
          <kbd className="text-[9.5px] bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded font-medium">⌘K</kbd>
          <span className="text-[11px]">Search history</span>
        </button>
      </div>

    </aside>
  );
}
