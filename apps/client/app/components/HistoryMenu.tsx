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
    requestAnimationFrame(() => {
      setVisible(true);
      setQuery('');
      setActive(0);
      inputRef.current?.focus();
    });

    fetch(`${API_BASE}/research/kbs`)
      .then((r) => r.json())
      .then((data: { id: string; query: string; updated_at: string; artifact_preview: string; status?: string }[]) => {
        setEntries(data.map((d) => ({
          id: d.id,
          query: d.query,
          updatedAt: d.updated_at,
          status: d.status as HistoryEntry['status'],
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        paddingLeft: '16px',
        paddingRight: '16px',
        background: visible ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
        transition: 'background 0.2s ease, backdrop-filter 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(14,16,24,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.07)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease',
          maxHeight: '70vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <svg style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            placeholder="Search research history…"
            style={{
              flex: 1,
              fontSize: '14px',
              color: 'rgba(255,255,255,0.85)',
              background: 'transparent',
              outline: 'none',
            }}
            className="placeholder:text-white/25"
          />
          <kbd style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '6px', flexShrink: 0 }}>esc</kbd>
        </div>

        {/* List */}
        <div ref={listRef} style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 60px)', overscrollBehavior: 'contain' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>{query ? 'No results' : 'No research history yet'}</p>
            </div>
          ) : (
            filtered.map((entry, i) => {
              const isCurrent = entry.id === currentKbId;
              const isActiveRow = i === active;
              return (
                <button
                  key={entry.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => { onSelect(entry); onClose(); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    transition: 'background 0.1s',
                    background: isActiveRow ? 'rgba(99,102,241,0.08)' : 'transparent',
                    borderLeft: `3px solid ${isCurrent ? 'rgba(99,102,241,0.7)' : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <p style={{ fontSize: '13.5px', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActiveRow ? 'rgba(165,168,255,0.95)' : 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.query}</span>
                      {entry.status === 'cancelled' && (
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(248,113,113,0.9)', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>Cancelled</span>
                      )}
                    </p>
                    {entry.preview && (
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{entry.preview}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingTop: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>{timeAgo(entry.updatedAt)}</span>
                    {isCurrent && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(129,140,248,0.9)', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', padding: '2px 7px', borderRadius: '20px' }}>current</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
              <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px', fontSize: '10px' }}>↑↓</kbd>
              navigate
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
              <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px', fontSize: '10px' }}>↵</kbd>
              open
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>{filtered.length} artifact{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
