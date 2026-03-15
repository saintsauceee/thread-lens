export type ToolCallStatus = 'pending' | 'active' | 'done';
export type AgentStatus = 'active' | 'done';
export type OrchestratorPhase = 'thinking' | 'spawning' | 'evaluating' | 'synthesizing' | 'done';
export type AppPhase = 'idle' | 'clarifying' | 'researching' | 'complete';

export interface ToolCall {
  id: number;
  label: string;
  status: ToolCallStatus;
}

export interface SubAgent {
  id: number;
  task: string;
  status: AgentStatus;
  toolCalls: ToolCall[];
  sourceCount: number | null;
  round: 1 | 2;
  dimmed?: boolean;
}

export interface ResearchArtifact {
  rawMarkdown: string;
  agentCount?: number;
  sourceCount?: number;
  durationSec?: number;
}

export interface HistoryEntry {
  id: string;
  query: string;
  updatedAt: string;
  status?: 'complete' | 'cancelled' | 'incomplete';
}
