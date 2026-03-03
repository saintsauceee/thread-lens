'use client';

import { useChat } from '../context/ChatContext';

function groupByDate(convs: { id: string; title: string; timestamp: Date }[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const week = today - 6 * 86400000;
  const groups: Record<string, typeof convs> = { Today: [], Yesterday: [], 'This week': [], Older: [] };
  for (const c of convs) {
    const t = new Date(c.timestamp.getFullYear(), c.timestamp.getMonth(), c.timestamp.getDate()).getTime();
    if (t >= today) groups['Today'].push(c);
    else if (t >= yesterday) groups['Yesterday'].push(c);
    else if (t >= week) groups['This week'].push(c);
    else groups['Older'].push(c);
  }
  return groups;
}

export default function Sidebar({ open }: { open: boolean }) {
  const { conversations, activeId, selectConversation, startNewChat } = useChat();
  const groups = groupByDate(conversations);

  return (
    <div
      className={`flex flex-col bg-neutral-900 border-r border-white/5 shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${
        open ? 'w-60' : 'w-0'
      }`}
    >
      {/* New chat */}
      <div className="px-3 pt-4 pb-3 shrink-0">
        <button
          onClick={startNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-100 hover:bg-white/5 transition-colors group"
        >
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="shrink-0 transition-colors group-hover:text-indigo-400"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="whitespace-nowrap">New chat</span>
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-5">
        {Object.entries(groups).map(([label, convs]) => {
          if (convs.length === 0) return null;
          return (
            <div key={label}>
              <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest px-3 mb-1.5">
                {label}
              </p>
              <div className="space-y-0.5">
                {convs.map((conv) => {
                  const active = activeId === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={`relative w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all whitespace-nowrap overflow-hidden ${
                        active
                          ? 'text-neutral-100'
                          : 'text-neutral-500 hover:text-neutral-200'
                      }`}
                    >
                      {/* Background */}
                      <div
                        className={`absolute inset-0 rounded-lg transition-all duration-200 ${
                          active ? 'bg-white/8' : 'bg-transparent hover:bg-white/4'
                        }`}
                      />
                      {/* Left accent bar */}
                      <div
                        className={`absolute left-0 top-[20%] bottom-[20%] w-[2px] rounded-full transition-all duration-200 ${
                          active ? 'bg-indigo-400 opacity-100' : 'bg-neutral-600 opacity-0'
                        }`}
                      />
                      <span className="relative block truncate pl-1 font-[450]">
                        {conv.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
