'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useChat } from '../context/ChatContext';

export default function MessageInput() {
  const { sendMessage, isTyping } = useChat();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const content = value.trim();
    if (!content || isTyping) return;
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(content);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
  };

  const canSend = value.trim().length > 0 && !isTyping;

  return (
    <div className="px-4 pb-5 pt-2">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-end gap-3 bg-neutral-800 border border-white/5 rounded-2xl px-4 py-3 focus-within:border-white/10 transition-colors">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask anything…"
            rows={1}
            disabled={isTyping}
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-600 resize-none outline-none leading-relaxed disabled:opacity-40"
            style={{ maxHeight: '96px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0 w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[11px] text-neutral-700 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
