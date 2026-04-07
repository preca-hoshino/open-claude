import type { Task, TaskStateBase } from '../../Task.js'

export type LocalWorkflowTaskState = TaskStateBase & {
  type: 'local_workflow'
  workflowId: string
  workflowName?: string
  summary?: string
  agentCount?: number
  agentStatuses?: Array<{
    name: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
    error?: string
  }>
}

export const LocalWorkflowTask: Task = null as any

export function killWorkflowTask(_taskId: string, _setAppState?: any): void {}

export function skipWorkflowAgent(_taskId: string, _agentName: string, _setAppState?: any): void {}

export function retryWorkflowAgent(_taskId: string, _agentName: string, _setAppState?: any): void {}
