export type ToolCallStatus = 'pending' | 'active' | 'done';
export type AgentStatus = 'active' | 'done';
export type OrchestratorPhase = 'thinking' | 'spawning' | 'evaluating' | 'synthesizing';
export type AppPhase = 'idle' | 'researching' | 'complete';

export interface ToolCall {
  id: number;
  subreddit: string;
  status: ToolCallStatus;
}

export interface SubAgent {
  id: number;
  task: string;
  status: AgentStatus;
  toolCalls: ToolCall[];
  sourceCount: number | null;
  round: 1 | 2;
}

export interface ReportSection {
  heading: string;
  body: string;
}

export interface ResearchReport {
  title: string;
  summary: string;
  sections: ReportSection[];
  sources: { label: string; domain: string }[];
  totalSources: number;
  durationSec: number;
}

// ── Subreddit extraction ──────────────────────────────────────────────────────

function extractSubreddits(query: string): string[] {
  const q = query.toLowerCase();
  const found: string[] = [];

  if (/ski|snow|slope|mogul|tremblant|whistler|vail|resort/.test(q))
    found.push('r/skiing', 'r/snowboarding');
  if (/tremblant|quebec|montreal/.test(q))
    found.push('r/Quebec', 'r/montreal');
  if (/trip|travel|visit|vacation|holiday|weekend/.test(q))
    found.push('r/travel', 'r/solotravel');
  if (/food|eat|restaurant|dine|cafe/.test(q))
    found.push('r/food');
  if (/hike|trail|outdoor|nature|camping/.test(q))
    found.push('r/hiking', 'r/outdoors');
  if (/budget|cheap|cost|afford/.test(q))
    found.push('r/Frugal');
  if (/canada|canadian/.test(q))
    found.push('r/canada');
  if (/nyc|new york|manhattan/.test(q))
    found.push('r/nyc', 'r/AskNYC');
  if (/london|uk|britain/.test(q))
    found.push('r/london', 'r/unitedkingdom');
  if (/japan|tokyo|osaka/.test(q))
    found.push('r/JapanTravel', 'r/japan');
  if (/crypto|bitcoin|ethereum/.test(q))
    found.push('r/CryptoCurrency', 'r/Bitcoin');
  if (/invest|stock|market|finance/.test(q))
    found.push('r/investing', 'r/personalfinance');
  if (/ai|llm|gpt|claude|machine learning/.test(q))
    found.push('r/artificial', 'r/MachineLearning');
  if (/running|marathon|fitness|gym/.test(q))
    found.push('r/running', 'r/fitness');
  if (/game|gaming|steam|pc/.test(q))
    found.push('r/gaming', 'r/pcgaming');

  const defaults = ['r/travel', 'r/AskReddit', 'r/LifeProTips', 'r/NoStupidQuestions', 'r/answers'];
  for (const d of defaults) {
    if (found.length >= 9) break;
    if (!found.includes(d)) found.push(d);
  }

  return [...new Set(found)].slice(0, 9);
}

// ── Agent builder ─────────────────────────────────────────────────────────────

function tc(id: number, subreddit: string): ToolCall {
  return { id, subreddit, status: 'pending' };
}

export function buildAgents(query: string): SubAgent[] {
  const s = extractSubreddits(query);
  // Ensure at least 9 slots
  while (s.length < 9) s.push('r/AskReddit');

  return [
    {
      id: 0, round: 1, status: 'active', sourceCount: null,
      task: 'Gathering firsthand trip reports and experiences',
      toolCalls: [tc(0, s[0]), tc(1, s[1]), tc(2, s[2])],
    },
    {
      id: 1, round: 1, status: 'active', sourceCount: null,
      task: 'Researching practical tips and logistics',
      toolCalls: [tc(0, s[1]), tc(1, s[3]), tc(2, s[0])],
    },
    {
      id: 2, round: 1, status: 'active', sourceCount: null,
      task: 'Discovering local recommendations and hidden gems',
      toolCalls: [tc(0, s[2]), tc(1, s[4]), tc(2, s[1])],
    },
    {
      id: 3, round: 1, status: 'active', sourceCount: null,
      task: 'Analyzing common questions, concerns, and warnings',
      toolCalls: [tc(0, s[3]), tc(1, s[0]), tc(2, s[5])],
    },
    {
      id: 4, round: 2, status: 'active', sourceCount: null,
      task: 'Filling coverage gaps flagged by orchestrator',
      toolCalls: [tc(0, s[4]), tc(1, s[6]), tc(2, s[2])],
    },
    {
      id: 5, round: 2, status: 'active', sourceCount: null,
      task: 'Cross-referencing and verifying key claims',
      toolCalls: [tc(0, s[5]), tc(1, s[7]), tc(2, s[3])],
    },
  ];
}

// ── Report ────────────────────────────────────────────────────────────────────

export function generateReport(query: string): ResearchReport {
  const subs = extractSubreddits(query);
  return {
    title: query,
    summary:
      'Synthesized from 6 parallel agents across 61 Reddit sources. ' +
      'Research covered firsthand accounts, practical logistics, local recommendations, ' +
      'and cross-referenced community knowledge to surface high-confidence insights.',
    sections: [
      {
        heading: 'Key Findings',
        body:
          'Across hundreds of Reddit threads, a clear consensus emerged on the most-recommended ' +
          'experiences and common pitfalls. High-upvote posts consistently highlighted 3–4 core themes, ' +
          'independently surfaced by multiple agents across different subreddits — a strong signal of ' +
          'reliability. Minority opinions were flagged and preserved in the breakdown below.',
      },
      {
        heading: 'Community Insights',
        body:
          'Long-form posts from frequent contributors provided the highest-quality signal. ' +
          'Agents identified 12 posts with 500+ upvotes directly relevant to this query, along with ' +
          '34 comment threads where locals and regulars shared off-the-beaten-path recommendations ' +
          'rarely found in traditional sources. Recency of posts was weighted to surface current, ' +
          'actionable information.',
      },
      {
        heading: 'Gaps & Caveats',
        body:
          'The orchestrator identified two topic areas with insufficient coverage after round 1, ' +
          'prompting a second agent wave. Coverage was strengthened as a result. Readers should note ' +
          'that Reddit skews toward specific demographics and some perspectives may be underrepresented. ' +
          'Posts older than 18 months were down-weighted due to potential outdatedness.',
      },
    ],
    sources: subs.slice(0, 8).map((sub) => ({
      label: `${sub} — Community thread`,
      domain: `reddit.com/${sub}`,
    })),
    totalSources: 61,
    durationSec: 8.8,
  };
}
