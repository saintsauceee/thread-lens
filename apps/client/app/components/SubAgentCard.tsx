'use client';

import { useEffect, useState } from 'react';
import { SubAgent, ToolCallStatus } from '../lib/simulationData';

function ToolPill({ subreddit: label, status }: { subreddit: string; status: ToolCallStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-all duration-300 ${
        status === 'pending'
          ? 'bg-neutral-100 text-neutral-400'
          : status === 'active'
          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
          : 'bg-neutral-100 text-neutral-600'
      }`}
    >
      {status === 'active' && (
        <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse shrink-0" />
      )}
      {status === 'done' && (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0">
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

  return (
    <div
      className={`rounded-xl border transition-all duration-500 ${
        dimmed
          ? 'border-neutral-200 bg-neutral-50'
          : cancelled && !isDone
          ? 'border-red-200 bg-white shadow-sm shadow-red-100'
          : isDone
          ? 'border-emerald-200 bg-white shadow-sm shadow-emerald-100'
          : 'border-indigo-200 bg-white shadow-sm shadow-indigo-100'
      }`}
      style={{
        opacity: visible ? (dimmed ? 0.5 : 1) : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease, border-color 0.5s, background-color 0.5s',
      }}
    >
      <button
        className="w-full flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide shrink-0">Agent {id + 1}</span>
          {collapsed && isDone && sourceCount !== null && (
            <span className="text-[11px] font-semibold text-emerald-600">
              {sourceCount} {sourceCount === 1 ? 'post' : 'posts'} collected
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {dimmed ? (
            <span className="text-[11px] font-medium text-neutral-400">Refocused</span>
          ) : cancelled && !isDone ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              <span className="text-[11px] font-medium text-red-400">Cancelled</span>
            </>
          ) : isDone ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="text-[11px] font-medium text-emerald-600">Done</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-[11px] font-medium text-indigo-600">Searching</span>
            </>
          )}
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`text-neutral-400 ml-1 transition-transform duration-300 ${collapsed ? '-rotate-90' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4">
          <p className="text-sm text-neutral-700 leading-snug mb-3">{task}</p>

          <div className="flex flex-wrap gap-1.5">
            {toolCalls.map((tc) => (
              <ToolPill key={tc.id} subreddit={tc.label} status={tc.status} />
            ))}
          </div>

          {isDone && sourceCount !== null && (
            <p className="mt-4 text-[11px] font-semibold text-emerald-600">
              {sourceCount} {sourceCount === 1 ? 'post' : 'posts'} collected
            </p>
          )}
        </div>
      )}
    </div>
  );
}
