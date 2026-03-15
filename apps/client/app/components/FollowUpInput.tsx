'use client';

import { useState } from 'react';

export default function FollowUpInput({ onSubmit }: { onSubmit: (question: string) => void }) {
  const [value, setValue] = useState('');

  function handleSubmit() {
    const text = value.trim();
    if (!text) return;
    setValue('');
    onSubmit(text);
  }

  return (
    <div className="mt-8 border border-neutral-200 rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
        <span className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Continue researching</span>
      </div>
      <div className="px-5 py-4 flex items-center gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder="Ask a follow-up question or expand the research…"
          className="flex-1 text-[13px] text-neutral-800 placeholder:text-neutral-400 bg-transparent outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="shrink-0 text-[12px] font-semibold bg-neutral-900 hover:bg-neutral-700 disabled:opacity-30 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Research
        </button>
      </div>
    </div>
  );
}
