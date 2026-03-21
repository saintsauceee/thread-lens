'use client';

import { useRef, useState, KeyboardEvent } from 'react';

interface Props {
  onSubmit: (query: string, fast: boolean) => void;
  placeholder?: string;
}

export default function SearchInput({ onSubmit, placeholder = 'Ask anything…' }: Props) {
  const [value, setValue] = useState('');
  const [fast, setFast] = useState(false);
  const [focused, setFocused] = useState(false);
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

  const canSubmit = !!value.trim();

  return (
    <div>
      {/* Animated gradient border wrapper */}
      <div
        style={{
          borderRadius: '20px',
          padding: '1px',
          backgroundImage: focused
            ? 'linear-gradient(90deg, rgba(99,102,241,0.6), rgba(139,92,246,0.35), rgba(59,130,246,0.35), rgba(99,102,241,0.6))'
            : 'none',
          backgroundColor: focused ? 'transparent' : 'rgba(255,255,255,0.08)',
          backgroundSize: '300% 100%',
          animation: focused ? 'border-shimmer 3s linear infinite' : 'none',
          boxShadow: focused
            ? '0 0 32px rgba(99,102,241,0.12), 0 4px 40px rgba(0,0,0,0.3)'
            : '0 2px 20px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <div
          style={{
            borderRadius: '19px',
            background: 'rgba(7,8,14,0.97)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 16px',
            minHeight: '58px',
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              color: '#dde3f5',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'none',
              outline: 'none',
              maxHeight: '200px',
              padding: '16px 0',
            }}
            className="placeholder:text-white/20"
          />

          <button
            type="button"
            onClick={() => setFast((f) => !f)}
            title="Fast mode: uses a lighter model"
            className="shrink-0 flex items-center gap-1.5"
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: fast ? '#facc15' : 'rgba(255,255,255,0.28)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.2s',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Fast
            </span>
            <span
              style={{
                position: 'relative',
                display: 'inline-flex',
                height: '18px',
                width: '32px',
                borderRadius: '9px',
                background: fast ? 'rgba(234,179,8,0.8)' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: fast ? '14px' : '2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  transition: 'left 0.2s',
                }}
              />
            </span>
          </button>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              flexShrink: 0,
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: canSubmit
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                : 'rgba(255,255,255,0.05)',
              border: canSubmit ? 'none' : '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s, box-shadow 0.2s',
              boxShadow: canSubmit ? '0 2px 16px rgba(99,102,241,0.45)' : 'none',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: canSubmit ? 1 : 0.25 }}
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.18)', marginTop: '10px' }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
