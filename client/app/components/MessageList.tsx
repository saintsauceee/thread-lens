'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { Message } from '../lib/fakeApi';

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 py-5">
      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <div className="flex items-center gap-1 pt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';

  // Very simple markdown-like rendering: code blocks and bold
  const renderContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).replace(/^\w+\n/, '');
        return (
          <pre key={i} className="mt-2 mb-1 bg-neutral-900 border border-white/5 rounded-lg px-4 py-3 text-xs text-neutral-300 overflow-x-auto font-mono leading-relaxed">
            {code}
          </pre>
        );
      }
      // bold
      const segments = part.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {segments.map((seg, j) =>
            seg.startsWith('**') && seg.endsWith('**')
              ? <strong key={j} className="font-semibold text-neutral-100">{seg.slice(2, -2)}</strong>
              : seg
          )}
        </span>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end py-2">
        <div className="max-w-xl bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-4">
      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <div className="flex-1 text-sm text-neutral-200 leading-relaxed min-w-0">
        {renderContent(msg.content)}
      </div>
    </div>
  );
}

function EmptyState() {
  const hour = new Date().getHours(); // no context needed
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col items-center gap-7 px-6 text-center">
      {/* Icon with layered glow */}
      <div className="relative">
        <div
          className="absolute -inset-10 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)' }}
        />
        <div
          className="relative w-[72px] h-[72px] rounded-[22px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"
          style={{ boxShadow: '0 0 48px rgba(99,102,241,0.45), 0 8px 32px rgba(0,0,0,0.5)' }}
        >
          {/* Heroicons solid sparkles */}
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
      </div>

      <div className="space-y-3">
        <h2
          className="text-[28px] font-semibold tracking-tight bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(135deg, #c7d2fe 0%, #ffffff 45%, #ddd6fe 100%)' }}
        >
          {greeting}
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Ask me anything — code, concepts, debugging, or ideas.
        </p>
      </div>
    </div>
  );
}

export default function MessageList() {
  const { messages, isTyping } = useChat();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Re-anchor to bottom when the container shrinks (textarea growing pushes it up)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isEmpty = messages.length === 0 && !isTyping;

  if (isEmpty) {
    return (
      <div className="flex-1 grid place-items-center overflow-hidden">
        <EmptyState />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 pb-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
