'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fakeApi, Message, Conversation } from '../lib/fakeApi';

interface ChatContextValue {
  conversations: Conversation[];
  activeId: string | null;
  messages: Message[];
  isTyping: boolean;
  selectConversation: (id: string) => void;
  startNewChat: () => void;
  sendMessage: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fakeApi.getConversations().then(setConversations);
  }, []);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    fakeApi.getMessages(activeId).then(setMessages);
  }, [activeId]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    let convId = activeId;

    if (!convId) {
      const newConv = await fakeApi.createConversation(content);
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      convId = newConv.id;
    }

    const userMsg = await fakeApi.sendMessage(convId, content);
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const reply = await fakeApi.getReply(convId, content);
    setIsTyping(false);
    setMessages((prev) => [...prev, reply]);

    // Update sidebar preview title if this was the first message
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, timestamp: new Date() } : c))
    );
  }, [activeId]);

  return (
    <ChatContext.Provider value={{ conversations, activeId, messages, isTyping, selectConversation, startNewChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}
