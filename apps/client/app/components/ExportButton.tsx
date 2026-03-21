'use client';

import { exportPDF } from '../lib/export';

export default function ExportButton(_: { kbId: string; query: string }) {
  return (
    <button
      onClick={exportPDF}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: 500,
        color: 'rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        padding: '5px 12px',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      Export
    </button>
  );
}
