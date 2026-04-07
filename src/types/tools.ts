/**
 * Centralized tool progress types.
 *
 * Extracted from individual tool files to break circular import cycles.
 * Each tool re-exports its progress type from here for backwards compatibility.
 */

import type { NormalizedMessage } from './message.js'

// ============================================================================
// Shell progress (shared by BashTool and PowerShellTool)
// ============================================================================

export type ShellProgress = {
  type: 'bash_progress' | 'powershell_progress'
  output: string
  fullOutput: string
  elapsedTimeSeconds: number
  totalLines: number
  totalBytes?: number
  timeoutMs?: number
  taskId?: string
}

export type BashProgress = {
  type: 'bash_progress'
  output: string
  fullOutput: string
  elapsedTimeSeconds: number
  totalLines: number
  totalBytes?: number
  timeoutMs?: number
  taskId?: string
}

export type PowerShellProgress = {
  type: 'powershell_progress'
  output: string
  fullOutput: string
  elapsedTimeSeconds: number
  totalLines: number
  totalBytes?: number
  timeoutMs?: number
  taskId?: string
}

// ============================================================================
// MCP progress
// ============================================================================

export type MCPProgress = {
  type: 'mcp_progress'
  status: 'started' | 'progress' | 'completed' | 'failed'
  serverName: string
  toolName: string
  progress?: number
  total?: number
  progressMessage?: string
  elapsedTimeMs?: number
}

// ============================================================================
// Web search progress
// ============================================================================

export type WebSearchProgress =
  | {
      type: 'query_update'
      query: string
    }
  | {
      type: 'search_results_received'
      resultCount: number
      query: string
    }

// ============================================================================
// Agent / Skill progress
// ============================================================================

export type AgentToolProgress = {
  type: 'agent_progress'
  message: NormalizedMessage
  prompt: string
  agentId: string
}

export type SkillToolProgress = {
  type: 'skill_progress'
  message: NormalizedMessage
  prompt: string
  agentId: string
}

// ============================================================================
// REPL progress
// ============================================================================

export type REPLToolProgress = {
  type: 'repl_progress'
  output: string
}

export type REPLToolCallProgress = {
  type: 'repl_tool_call'
  phase: 'start' | 'end'
  toolName: string
  toolInput: unknown
}

// ============================================================================
// TaskOutput progress
// ============================================================================

export type TaskOutputProgress = {
  type: 'task_output_progress'
}

// ============================================================================
// SDK workflow progress (used by sdkEventQueue / sdkProgress)
// ============================================================================

export type SdkWorkflowProgress = {
  type?: string
  index?: number
  phaseIndex?: number
  step?: string
  status?: string
  detail?: string
  [key: string]: unknown
}

// ============================================================================
// Union of all tool progress types
// ============================================================================

export type ToolProgressData =
  | BashProgress
  | PowerShellProgress
  | MCPProgress
  | WebSearchProgress
  | AgentToolProgress
  | SkillToolProgress
  | REPLToolProgress
  | REPLToolCallProgress
  | TaskOutputProgress
  | ShellProgress
