import type { ConfigScope } from '../mcp/types.js'

export type LspServerState = 'starting' | 'running' | 'stopped' | 'failed' | 'error' | 'stopping'

export type LspServerConfig = {
  command: string
  args?: string[]
  env?: Record<string, string>
  languageIds?: string[]
  filePatterns?: string[]
  initializationOptions?: Record<string, unknown>
  rootUri?: string
}

export type ScopedLspServerConfig = LspServerConfig & {
  scope: ConfigScope
  pluginSource?: string
  source?: string
  restartOnCrash?: boolean
  shutdownTimeout?: number
  startupTimeout?: number
  maxRestarts?: number
  workspaceFolder?: string
  extensionToLanguage?: Record<string, string>
}
