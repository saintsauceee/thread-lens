'use client';

import { useEffect, useRef, useState } from 'react';
import { HistoryEntry } from '../lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface KbEntry extends HistoryEntry {
  preview: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

export default function HistoryMenu({
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
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { requestAnimationFrame(() => setVisible(false)); return; }
    requestAnimationFrame(() => setVisible(true));
    setQuery('');
    setActive(0);
    inputRef.current?.focus();

    fetch(`${API_BASE}/research/kbs`)
      .then((r) => r.json())
      .then((data: { id: string; query: string; updated_at: string; artifact_preview: string }[]) => {
        setEntries(data.map((d) => ({
          id: d.id,
          query: d.query,
          updatedAt: d.updated_at,
          preview: d.artifact_preview?.replace(/^#+\s*/gm, '').replace(/\*+/g, '').trim() ?? '',
        })));
      })
      .catch(() => {});
  }, [open]);

  const filtered = query.trim()
    ? entries.filter((e) => e.query.toLowerCase().includes(query.toLowerCase()))
    : entries;


  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === 'Enter' && filtered[active]) { onSelect(filtered[active]); onClose(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, active]);

  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onClose(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      style={{
        background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
        transition: 'background 0.2s ease, backdrop-filter 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: '620px',
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '18px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease',
          maxHeight: '70vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
          <svg className="text-neutral-400 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            placeholder="Search research history…"
            className="flex-1 text-[14px] text-neutral-800 placeholder:text-neutral-400 bg-transparent outline-none"
          />
          <kbd className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md shrink-0">esc</kbd>
        </div>

        {/* List */}
        <div ref={listRef} className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(70vh - 60px)' }}>
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] text-neutral-400">{query ? 'No results' : 'No research history yet'}</p>
            </div>
          ) : (
            filtered.map((entry, i) => {
              const isCurrent = entry.id === currentKbId;
              const isActive = i === active;
              return (
                <button
                  key={entry.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => { onSelect(entry); onClose(); }}
                  className="w-full text-left px-5 py-3.5 flex items-start gap-4 transition-colors"
                  style={{
                    background: isActive ? 'rgba(99,102,241,0.06)' : 'transparent',
                    borderLeft: `3px solid ${isCurrent ? '#6366f1' : 'transparent'}`,
                  }}
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <p
                      className="text-[13px] font-semibold leading-snug truncate"
                      style={{ color: isActive ? '#4338ca' : '#171717' }}
                    >
                      {entry.query}
                    </p>
                    {entry.preview && (
                      <p className="text-[12px] text-neutral-400 leading-relaxed line-clamp-2">{entry.preview}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                    <span className="text-[11px] text-neutral-400 whitespace-nowrap">{timeAgo(entry.updatedAt)}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">current</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-4 px-5 py-2.5 border-t border-neutral-100">
            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
              <kbd className="bg-neutral-100 px-1 py-0.5 rounded text-[10px]">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
              <kbd className="bg-neutral-100 px-1 py-0.5 rounded text-[10px]">↵</kbd> open
            </span>
            <span className="ml-auto text-[11px] text-neutral-400">{filtered.length} artifact{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
