'use client';

import { useState } from 'react';

export default function FollowUpInput({ onSubmit }: { onSubmit: (question: string) => void }) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  function handleSubmit() {
    const text = value.trim();
    if (!text) return;
    setValue('');
    onSubmit(text);
  }

  return (
    <div
      style={{
        marginTop: '24px',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${focused ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.08)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <div style={{ padding: '12px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(192,132,252,0.7)' }} />
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Continue researching</span>
      </div>
      <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask a follow-up question or expand the research…"
          style={{
            flex: 1,
            fontSize: '13px',
            color: 'rgba(255,255,255,0.75)',
            background: 'transparent',
            outline: 'none',
          }}
          className="placeholder:text-white/20"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          style={{
            flexShrink: 0,
            fontSize: '12px',
            fontWeight: 600,
            background: value.trim() ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
            color: value.trim() ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)',
            border: `1px solid ${value.trim() ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
            padding: '7px 16px',
            borderRadius: '9px',
            cursor: value.trim() ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (value.trim()) e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
          }}
          onMouseLeave={(e) => {
            if (value.trim()) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
        >
          Research
        </button>
      </div>
    </div>
  );
}
