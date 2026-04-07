import type { Task, TaskStateBase } from '../../Task.js'

export type MonitorMcpTaskState = TaskStateBase & {
  type: 'monitor_mcp'
  serverName: string
}

export const MonitorMcpTask: Task = null as any

export function killMonitorMcp(_taskId: string, _setAppState?: any): void {}

export function killMonitorMcpTasksForAgent(_agentId: string, _getAppState?: any, _setAppState?: any): void {}
