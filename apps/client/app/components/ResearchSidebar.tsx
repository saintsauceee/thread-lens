'use client';

import React, { useEffect, useState } from 'react';
import { HistoryEntry } from '../lib/types';
import { toast } from './Toast';

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
  activeStatus,
}: {
  currentKbId: string | null;
  onSelect: (entry: HistoryEntry) => void;
  onNew: () => void;
  refreshKey: number;
  pendingQuery?: string;
  activeStatus?: 'running' | 'cancelled';
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    toast('Research deleted');
    await fetch(`${API_BASE}/research/kb/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  useEffect(() => {
    fetch(`${API_BASE}/research/kbs`)
      .then((r) => r.json())
      .then((data: { id: string; query: string; updated_at: string; status?: string }[]) => {
        setEntries(data.map((d) => ({ id: d.id, query: d.query, updatedAt: d.updated_at, status: d.status as HistoryEntry['status'] })));
      })
      .catch(() => {});
  }, [refreshKey]);

  return (
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 flex flex-col bg-white" style={{ borderRight: '1px solid #ebebeb' }}>

      {/* Header */}
      <div className="px-3 pt-4 pb-3 flex flex-col gap-4">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-600 hover:text-neutral-800 transition-colors"
          style={{ background: '#f3f4f6', border: '1px solid #e5e7eb' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#ebebec'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f3f4f6'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-[12px] font-medium">New research</span>
        </button>
        <span className="text-[10.5px] font-medium text-neutral-400 px-1">History</span>
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
            const resolvedStatus = active ? (activeStatus ?? (entry.status === 'cancelled' ? 'cancelled' : undefined)) : entry.status;
            const isCancelled = resolvedStatus === 'cancelled';
            const isRunning = resolvedStatus === 'running';
            return (
              <div
                key={entry.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(entry)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(entry)}
                onMouseEnter={() => setHoveredId(entry.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`w-full text-left px-2 py-2 rounded-md mb-px flex items-start gap-1 transition-colors cursor-pointer ${
                  active ? (isCancelled ? 'bg-red-50' : 'bg-indigo-50') : 'hover:bg-neutral-50'
                }`}
                style={{ border: `1px solid ${isRunning ? '#a5b4fc' : isCancelled ? '#fca5a5' : 'transparent'}` }}
              >
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className={`text-[12.5px] leading-snug truncate ${
                    active ? (isCancelled ? 'text-red-700 font-medium' : 'text-indigo-700 font-medium') : 'text-neutral-600'
                  }`}>
                    {entry.query}
                  </span>
                  {isRunning ? (
                    <span className="flex items-center gap-1 text-[11px] text-indigo-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />
                      in progress
                    </span>
                  ) : isCancelled ? (
                    <span className="flex items-center gap-1 text-[11px] text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                      cancelled
                    </span>
                  ) : (
                    <span className={`text-[11px] ${active ? 'text-indigo-400' : 'text-neutral-300'}`}>
                      {timeAgo(entry.updatedAt)}
                    </span>
                  )}
                </div>
                {hoveredId === entry.id && (
                  <button
                    onClick={(e) => handleDelete(e, entry.id)}
                    className="shrink-0 self-center p-1 rounded-md text-neutral-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                    </svg>
                  </button>
                )}
              </div>
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
