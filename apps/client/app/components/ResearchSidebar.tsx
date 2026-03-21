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
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function handleDeleteClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setConfirmId(id);
  }

  async function confirmDelete() {
    if (!confirmId) return;
    const id = confirmId;
    setConfirmId(null);
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    toast('Research deleted');
    if (id === currentKbId) onNew();
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
    <aside
      style={{
        width: '248px',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(10,12,20,0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 12px 12px' }}>
        <button
          onClick={onNew}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
            fontSize: '12px',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New research
        </button>

        <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '16px', paddingLeft: '4px' }}>
          History
        </p>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px', scrollbarWidth: 'none' }}>
        {pendingQuery && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              marginBottom: '2px',
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.2)',
            }}
          >
            <span style={{ fontSize: '12px', lineHeight: 1.4, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(251,191,36,0.9)', fontWeight: 500 }}>{pendingQuery}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'rgba(251,191,36,0.6)', marginTop: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(251,191,36,0.7)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              preparing
            </span>
          </div>
        )}

        {entries.length === 0 && !pendingQuery ? (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', padding: '8px 10px' }}>No research yet</p>
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
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  marginBottom: '1px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  background: active
                    ? isCancelled
                      ? 'rgba(248,113,113,0.07)'
                      : isRunning
                      ? 'rgba(99,102,241,0.1)'
                      : 'rgba(99,102,241,0.08)'
                    : hoveredId === entry.id
                    ? 'rgba(255,255,255,0.04)'
                    : 'transparent',
                  border: `1px solid ${
                    isRunning
                      ? 'rgba(99,102,241,0.3)'
                      : isCancelled && active
                      ? 'rgba(248,113,113,0.2)'
                      : active
                      ? 'rgba(99,102,241,0.2)'
                      : 'transparent'
                  }`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span
                    style={{
                      fontSize: '12.5px',
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: active
                        ? isCancelled
                          ? 'rgba(248,113,113,0.9)'
                          : 'rgba(165,168,255,0.95)'
                        : 'rgba(255,255,255,0.55)',
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {entry.query}
                  </span>

                  {isRunning ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'rgba(129,140,248,0.7)' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#818cf8', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                      in progress
                    </span>
                  ) : isCancelled ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: 'rgba(248,113,113,0.6)' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
                      cancelled
                    </span>
                  ) : (
                    <span style={{ fontSize: '10.5px', color: active ? 'rgba(129,140,248,0.5)' : 'rgba(255,255,255,0.2)' }}>
                      {timeAgo(entry.updatedAt)}
                    </span>
                  )}
                </div>

                {confirmId === entry.id ? (
                  <div style={{ flexShrink: 0, alignSelf: 'center', display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmId(null); }}
                      style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.35)', padding: '2px 6px', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); confirmDelete(); }}
                      style={{ fontSize: '10px', fontWeight: 600, color: 'white', background: 'rgba(239,68,68,0.8)', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                ) : hoveredId === entry.id && (
                  <button
                    onClick={(e) => handleDeleteClick(e, entry.id)}
                    style={{
                      flexShrink: 0,
                      alignSelf: 'center',
                      padding: '4px',
                      borderRadius: '6px',
                      color: 'rgba(255,255,255,0.2)',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'rgba(248,113,113,0.8)';
                      e.currentTarget.style.background = 'rgba(248,113,113,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.2)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'rgba(255,255,255,0.2)',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; }}
        >
          <kbd style={{ fontSize: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '5px', fontWeight: 600, color: 'inherit' }}>⌘K</kbd>
          <span style={{ fontSize: '11px' }}>Search history</span>
        </button>
      </div>
    </aside>
  );
}
