'use client';

import { exportPDF } from '../lib/export';

export default function ExportButton(_: { kbId: string; query: string }) {
  return (
    <button
      onClick={exportPDF}
      className="flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 bg-white border border-neutral-200 px-3 py-1 rounded-full shadow-sm hover:text-neutral-700 hover:border-neutral-300 transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      Export
    </button>
  );
}
