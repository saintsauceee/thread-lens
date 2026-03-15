'use client';

import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
}

let _addToast: ((text: string) => void) | null = null;

export function toast(text: string) {
  _addToast?.(text);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    _addToast = (text) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, text }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
    };
    return () => { _addToast = null; };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="text-[12px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2 shadow-md"
          style={{ animation: 'fadeInUp 0.2s ease' }}
        >
          {t.text}
        </div>
      ))}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
