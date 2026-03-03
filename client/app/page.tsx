'use client';

import { useState } from 'react';
import { ChatProvider } from './context/ChatContext';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ChatProvider>
      <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
        <Sidebar open={sidebarOpen} />
        <div className="flex flex-col flex-1 min-w-0 relative">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="absolute top-3 left-3 z-10 p-1.5 rounded-md text-neutral-600 hover:text-neutral-300 hover:bg-white/5 transition-colors"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <MenuIcon />
          </button>
          <MessageList />
          <MessageInput />
        </div>
      </div>
    </ChatProvider>
  );
}
