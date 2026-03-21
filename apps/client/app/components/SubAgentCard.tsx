'use client';

import { useEffect, useState } from 'react';
import { SubAgent, ToolCallStatus } from '../lib/types';

function ToolPill({ subreddit: label, status }: { subreddit: string; status: ToolCallStatus }) {
  const styles = {
    pending: {
      background: 'rgba(255,255,255,0.04)',
      color: 'rgba(255,255,255,0.3)',
      border: '1px solid rgba(255,255,255,0.06)',
    },
    active: {
      background: 'rgba(99,102,241,0.1)',
      color: 'rgba(165,168,255,0.9)',
      border: '1px solid rgba(99,102,241,0.25)',
    },
    done: {
      background: 'rgba(255,255,255,0.04)',
      color: 'rgba(255,255,255,0.45)',
      border: '1px solid rgba(255,255,255,0.06)',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 500,
        padding: '3px 8px',
        borderRadius: '20px',
        transition: 'all 0.3s',
        ...styles[status],
      }}
    >
      {status === 'active' && (
        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#818cf8', display: 'inline-block', animation: 'pulse 2s infinite', flexShrink: 0 }} />
      )}
      {status === 'done' && (
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(52,211,153,0.8)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
      {label}
    </span>
  );
}

export default function SubAgentCard({ agent, cancelled }: { agent: SubAgent; cancelled?: boolean }) {
  const { status, task, sourceCount, id, toolCalls, dimmed } = agent;
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const isDone = status === 'done';
  const isActive = status === 'active' && !cancelled;
  const isCancelledCard = cancelled && !isDone;

  const borderColor = dimmed
    ? 'rgba(255,255,255,0.06)'
    : isCancelledCard
    ? 'rgba(248,113,113,0.2)'
    : isDone
    ? 'rgba(52,211,153,0.2)'
    : 'rgba(99,102,241,0.25)';

  const shadowColor = dimmed
    ? 'transparent'
    : isCancelledCard
    ? 'rgba(239,68,68,0.06)'
    : isDone
    ? 'rgba(52,211,153,0.06)'
    : 'rgba(99,102,241,0.08)';

  return (
    <div
      style={{
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        background: dimmed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
        boxShadow: `0 2px 20px ${shadowColor}`,
        opacity: visible ? (dimmed ? 0.45 : 1) : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease, border-color 0.5s, box-shadow 0.5s',
        overflow: 'hidden',
      }}
    >
      <button
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          cursor: 'pointer',
          background: 'transparent',
          textAlign: 'left',
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
            Agent {id + 1}
          </span>
          {collapsed && isDone && sourceCount !== null && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(52,211,153,0.8)' }}>
              {sourceCount} {sourceCount === 1 ? 'post' : 'posts'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
          {dimmed ? (
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.25)' }}>Refocused</span>
          ) : isCancelledCard ? (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(248,113,113,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(248,113,113,0.7)' }}>Cancelled</span>
            </>
          ) : isDone ? (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(52,211,153,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(52,211,153,0.8)' }}>Done</span>
            </>
          ) : (
            <>
              <svg style={{ width: '11px', height: '11px', animation: 'spin 1s linear infinite', color: 'rgba(129,140,248,0.8)' }} viewBox="0 0 24 24" fill="none">
                <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(129,140,248,0.8)' }}>Searching</span>
            </>
          )}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              marginLeft: '2px',
              transition: 'transform 0.3s',
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, marginBottom: '12px' }}>{task}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {toolCalls.map((tc) => (
              <ToolPill key={tc.id} subreddit={tc.label} status={tc.status} />
            ))}
          </div>

          {isDone && sourceCount !== null && (
            <p style={{ marginTop: '14px', fontSize: '11px', fontWeight: 600, color: 'rgba(52,211,153,0.75)' }}>
              {sourceCount} {sourceCount === 1 ? 'post' : 'posts'} collected
            </p>
          )}
        </div>
      )}
    </div>
  );
}
