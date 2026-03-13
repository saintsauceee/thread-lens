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

export default function SubAgentCard({ agent }: { agent: SubAgent }) {
  const { status, task, sourceCount, id, toolCalls } = agent;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-500 ${
        status === 'active'
          ? 'border-indigo-200 bg-white shadow-sm shadow-indigo-100'
          : 'border-emerald-200 bg-white shadow-sm shadow-emerald-100'
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease, border-color 0.5s, background-color 0.5s',
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Agent {id + 1}</span>
        <div className="flex items-center gap-1.5">
          {status === 'active' ? (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
          <span className={`text-[11px] font-medium ${status === 'active' ? 'text-indigo-600' : 'text-emerald-600'}`}>
            {status === 'active' ? 'Searching' : 'Done'}
          </span>
        </div>
      </div>

      <p className="text-sm text-neutral-700 leading-snug mb-3">{task}</p>

      <div className="flex flex-wrap gap-1.5">
        {toolCalls.map((tc) => (
          <ToolPill key={tc.id} subreddit={tc.label} status={tc.status} />
        ))}
      </div>

      {status === 'done' && sourceCount !== null && (
        <p className="mt-4 text-[11px] font-semibold text-emerald-600">{sourceCount} posts collected</p>
      )}
    </div>
  );
}
