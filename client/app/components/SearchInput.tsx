'use client';

import { useRef, useState, KeyboardEvent } from 'react';

interface Props {
  onSubmit: (query: string) => void;
  placeholder?: string;
}

export default function SearchInput({ onSubmit, placeholder = 'Ask anything…' }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const query = value.trim();
    if (!query) return;
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSubmit(query);
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
        className="flex items-center gap-3 bg-white border border-neutral-200 rounded-2xl px-4 shadow-sm focus-within:border-neutral-300 transition-colors"
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
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="shrink-0 w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
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
