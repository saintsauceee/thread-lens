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

export default function HistoryPanel({
  open,
  onClose,
  onSelect,
  currentKbId,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (entry: HistoryEntry) => void;
  currentKbId: string | null;
}) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(null);
    fetch(`${API_BASE}/research/kbs`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { id: string; query: string; updated_at: string }[]) => {
        setEntries(data.map((d) => ({ id: d.id, query: d.query, updatedAt: d.updated_at })));
      })
      .catch(() => { setEntries([]); });
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20"
          onClick={onClose}
        />
      )}

      <div
        className="fixed top-0 right-0 h-full z-30 bg-white border-l border-neutral-200 shadow-xl flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: '340px',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <p className="text-[13px] font-semibold text-neutral-800">History</p>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {entries === null ? (
            <div className="flex flex-col gap-2 px-4 py-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex flex-col gap-1.5">
                  <div className="h-3 bg-neutral-100 rounded w-3/4" />
                  <div className="h-2.5 bg-neutral-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : entries?.length === 0 ? (
            <p className="text-[12px] text-neutral-400 text-center mt-8">No history yet</p>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => { onSelect(entry); onClose(); }}
                className={`w-full text-left px-5 py-3 flex flex-col gap-0.5 hover:bg-neutral-50 transition-colors border-l-2 ${
                  currentKbId === entry.id ? 'border-indigo-500 bg-indigo-50/50' : 'border-transparent'
                }`}
              >
                <span className="text-[13px] text-neutral-800 leading-snug line-clamp-2">{entry.query}</span>
                <span className="text-[11px] text-neutral-400">{timeAgo(entry.updatedAt)}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
