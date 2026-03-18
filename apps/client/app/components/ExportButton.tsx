'use client';

import { useState, useRef, useEffect } from 'react';
import { ExportData, downloadMarkdown, downloadJSON, exportPDF } from '../lib/export';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function ExportButton({ kbId }: { kbId: string; query: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  async function fetchExportData(): Promise<ExportData | null> {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/research/kb/${kbId}/export`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkdown() {
    setOpen(false);
    const data = await fetchExportData();
    if (data) downloadMarkdown(data);
  }

  async function handleJSON() {
    setOpen(false);
    const data = await fetchExportData();
    if (data) downloadJSON(data);
  }

  function handlePDF() {
    setOpen(false);
    exportPDF();
  }

  const options = [
    { label: 'Markdown (.md)', action: handleMarkdown },
    { label: 'JSON (.json)', action: handleJSON },
    { label: 'PDF', action: handlePDF },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 bg-white border border-neutral-200 px-3 py-1 rounded-full shadow-sm hover:text-neutral-700 hover:border-neutral-300 transition-colors disabled:opacity-50"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        {loading ? 'Exporting…' : 'Export'}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-10 w-44">
          {options.map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full text-left px-4 py-2.5 text-[13px] text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
