export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
}

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

const messagesStore: Record<string, Message[]> = {
  'conv-seed-1': [
    { id: 's1-m1', content: 'What are the key differences between TypeScript interfaces and types?', role: 'user', timestamp: new Date(Date.now() - 86400000) },
    { id: 's1-m2', content: "Great question. Both `interface` and `type` can describe object shapes, but they differ in a few important ways.\n\n**Interfaces** are open — you can extend or merge them across multiple declarations. They're ideal for describing the shape of objects and classes.\n\n**Types** are closed and more versatile — they can represent unions, intersections, primitives, and tuples, which interfaces can't.\n\nA practical rule: use `interface` for public API contracts and class shapes, use `type` for everything else — especially unions like `type Status = 'idle' | 'loading' | 'error'`.", role: 'assistant', timestamp: new Date(Date.now() - 86390000) },
    { id: 's1-m3', content: 'When would you use an intersection type?', role: 'user', timestamp: new Date(Date.now() - 86380000) },
    { id: 's1-m4', content: "Intersection types (`A & B`) are useful when you want to combine multiple types into one — the result must satisfy all of them.\n\nA common pattern is composing props:\n\n```ts\ntype WithId = { id: string };\ntype User = { name: string; email: string };\ntype UserRecord = User & WithId; // has id, name, and email\n```\n\nYou'll also see them used in higher-order components or when merging third-party types with your own extensions.", role: 'assistant', timestamp: new Date(Date.now() - 86370000) },
  ],
  'conv-seed-2': [
    { id: 's2-m1', content: 'Explain React Server Components in simple terms', role: 'user', timestamp: new Date(Date.now() - 172800000) },
    { id: 's2-m2', content: "Think of it this way: normally, React components run in the browser. Server Components run on the server *at request time* — they fetch data, render HTML, and send it down. The browser never downloads their JavaScript.\n\nThis means:\n- **Zero bundle size** for server components\n- **Direct database/filesystem access** without an API layer\n- **Faster initial loads** since the client gets pre-rendered HTML\n\nClient Components (the classic kind) still handle interactivity and state. The key mental model: server components are for data fetching and layout, client components are for anything interactive.", role: 'assistant', timestamp: new Date(Date.now() - 172790000) },
  ],
};

const conversationsData: Conversation[] = [
  { id: 'conv-seed-1', title: 'TypeScript interfaces vs types', timestamp: new Date(Date.now() - 86400000) },
  { id: 'conv-seed-2', title: 'React Server Components explained', timestamp: new Date(Date.now() - 172800000) },
];

let convCounter = 3;

// Keyword-based response pool
function generateReply(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes('code') || msg.includes('function') || msg.includes('implement') || msg.includes('write')) {
    const responses = [
      "Here's a clean implementation:\n\n```ts\nfunction debounce<T extends (...args: unknown[]) => void>(\n  fn: T,\n  delay: number\n): (...args: Parameters<T>) => void {\n  let timer: ReturnType<typeof setTimeout>;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}\n```\n\nThis is a generic debounce that preserves type safety. The `Parameters<T>` utility type ensures the wrapper accepts the same arguments as the original function.",
      "Sure, here's one way to approach it:\n\n```ts\nasync function fetchWithRetry<T>(\n  url: string,\n  retries = 3\n): Promise<T> {\n  for (let i = 0; i < retries; i++) {\n    try {\n      const res = await fetch(url);\n      if (!res.ok) throw new Error(`HTTP ${res.status}`);\n      return res.json();\n    } catch (err) {\n      if (i === retries - 1) throw err;\n      await new Promise(r => setTimeout(r, 2 ** i * 300));\n    }\n  }\n  throw new Error('unreachable');\n}\n```\n\nThis uses exponential backoff — each retry waits longer than the last.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (msg.includes('explain') || msg.includes('what is') || msg.includes('how does') || msg.includes('why')) {
    const responses = [
      "Good question. The core idea is straightforward once you see it from the right angle.\n\nThe reason this works is because of how JavaScript handles the event loop — asynchronous operations are queued as microtasks, which run after the current call stack empties but before the next render. This is why you can `await` inside an `async` function without blocking the main thread.\n\nIn practice, this means your UI stays responsive even during heavy data fetching.",
      "At its core, this pattern solves one specific problem: coordinating state that multiple components need to share without prop drilling.\n\nThe key insight is that React's rendering model is a tree. State lives at a node and flows downward. When you need state to flow sideways or upward, you lift it — or use context to teleport it directly to the consumers that need it.\n\nContext is essentially a named channel that any descendant can subscribe to.",
      "Think of it in three parts:\n\n1. **The problem** — you have data that changes over time and a UI that needs to reflect it\n2. **The mechanism** — a reactive system that tracks dependencies and re-runs only what's affected\n3. **The tradeoff** — more predictability in exchange for learning a new mental model\n\nOnce that clicks, most of the API choices start to make sense.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (msg.includes('best') || msg.includes('recommend') || msg.includes('should i') || msg.includes('which')) {
    const responses = [
      "It depends on your constraints, but here's how I'd frame the decision:\n\n- If you're building something that needs to move fast and you have full-stack control — **Next.js** is the safe bet. Great ecosystem, excellent DX, and RSC support is mature now.\n- If you want more flexibility and don't need SSR — **Vite + React** is leaner and gets out of your way.\n- If SEO and performance are critical from day one — lean toward Next.js with server components.\n\nFor most projects, Next.js is the pragmatic choice.",
      "My honest take: don't optimize for the tool, optimize for the problem. That said, a few things that rarely go wrong:\n\n- **Zod** for runtime validation — it pairs perfectly with TypeScript\n- **React Query / TanStack Query** for server state\n- **Zustand** if you need global client state without the Redux overhead\n\nStart minimal. Add complexity only when you feel the pain of not having it.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (msg.includes('error') || msg.includes('bug') || msg.includes('fix') || msg.includes('issue') || msg.includes('problem')) {
    const responses = [
      "This looks like a race condition. The issue is that the async operation completes after the component unmounts, trying to update state that no longer exists.\n\nFix it with a cleanup flag:\n\n```ts\nuseEffect(() => {\n  let cancelled = false;\n  fetchData().then(data => {\n    if (!cancelled) setState(data);\n  });\n  return () => { cancelled = true; };\n}, []);\n```\n\nOr use an `AbortController` if you're working with `fetch` directly — that also cancels the in-flight request.",
      "A few things to check:\n\n1. **Is the dependency array correct?** Missing deps in `useEffect` cause stale closures — the function closes over an old value.\n2. **Are you mutating state directly?** React needs a new reference to detect changes. Use spread syntax or `structuredClone` for objects.\n3. **Is this happening in strict mode?** React 18 double-invokes effects in development to surface cleanup issues.\n\nShare the error message or the relevant snippet if you want me to dig deeper.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Generic fallback responses
  const generic = [
    "That's a solid approach. A few things worth considering as you move forward:\n\nFirst, think about the boundary between what needs to be dynamic vs. what can be static — keeping that clear saves a lot of complexity later. Second, if this is going to scale, investing early in consistent error handling pays off significantly. Third, write the interface before the implementation; it forces you to think about usage before you're committed to a design.",
    "Interesting. The conventional wisdom here is to keep things flat and push complexity to the edges — but the right call really depends on how the data flows through your system.\n\nIf you're seeing the same piece of state needed in three or more places, that's usually the signal to lift it or reach for context. Below that threshold, local state is almost always simpler and easier to reason about.",
    "A few thoughts:\n\n- Start with the simplest version that could work — you can always add abstraction, but it's painful to remove it\n- Colocate logic with the thing that owns it; files shouldn't talk to things they don't know about\n- If a function is hard to name, it probably does too many things\n\nWhat's the specific constraint you're working around? That might change the answer.",
    "The short answer is yes, but with a caveat.\n\nIt works reliably in the happy path, but the edge cases — network failures, partial data, concurrent updates — need explicit handling. Most production bugs live in that gap between 'it works in my test' and 'it works under real conditions'.\n\nIf you want to harden this, I'd start with the failure modes: what happens if the request times out? If the response is malformed? If two users update the same record simultaneously?",
  ];

  return generic[Math.floor(Math.random() * generic.length)];
}

export const fakeApi = {
  async getConversations(): Promise<Conversation[]> {
    await delay(200);
    return [...conversationsData].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    await delay(150);
    return [...(messagesStore[conversationId] ?? [])];
  },

  async createConversation(firstMessage: string): Promise<Conversation> {
    await delay(100);
    const id = `conv-${convCounter++}`;
    const title = firstMessage.length > 50 ? firstMessage.slice(0, 50).trim() + '…' : firstMessage;
    const conv: Conversation = { id, title, timestamp: new Date() };
    conversationsData.push(conv);
    messagesStore[id] = [];
    return conv;
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    await delay(60);
    const msg: Message = { id: `${conversationId}-${Date.now()}`, content, role: 'user', timestamp: new Date() };
    messagesStore[conversationId] = [...(messagesStore[conversationId] ?? []), msg];
    return msg;
  },

  async getReply(conversationId: string, userMessage: string): Promise<Message> {
    await delay(1000 + Math.random() * 800);
    const content = generateReply(userMessage);
    const msg: Message = { id: `${conversationId}-reply-${Date.now()}`, content, role: 'assistant', timestamp: new Date() };
    messagesStore[conversationId] = [...(messagesStore[conversationId] ?? []), msg];
    return msg;
  },
};
