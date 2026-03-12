'use client';

import { useRef, useState, KeyboardEvent } from 'react';

interface Props {
  onSubmit: (query: string, fast: boolean) => void;
  placeholder?: string;
}

export default function SearchInput({ onSubmit, placeholder = 'Ask anything…' }: Props) {
  const [value, setValue] = useState('');
  const [fast, setFast] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const query = value.trim();
    if (!query) return;
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSubmit(query, fast);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 bg-white border border-neutral-200 rounded-l-2xl rounded-r-xl px-4 shadow-sm focus-within:border-neutral-300 transition-colors"
        style={{ minHeight: '52px' }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 resize-none outline-none leading-relaxed py-3"
          style={{ maxHeight: '200px' }}
        />
        <button
          type="button"
          onClick={() => setFast((f) => !f)}
          className="shrink-0 flex items-center gap-1.5 group"
          title="Fast mode: uses a lighter model"
        >
          <span className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${fast ? 'text-yellow-500' : 'text-neutral-400'}`}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Fast
          </span>
          <span
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
              fast ? 'bg-yellow-400' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${
                fast ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </span>
        </button>
        <div className="w-px h-4 bg-neutral-200 shrink-0" />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="shrink-0 w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
      <p className="text-center text-[11px] text-neutral-400 mt-2">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
