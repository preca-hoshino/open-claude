import type { PluginError } from '../../types/plugin.js'
import type { MCPServerConnection, ConfigScope } from '../../services/mcp/types.js'
import type { LoadedPlugin } from '../../types/plugin.js'

export type UnifiedInstalledItem =
  | {
      type: 'plugin'
      id: string
      name: string
      description?: string
      marketplace: string
      scope: string
      isEnabled: boolean
      errorCount: number
      errors: PluginError[]
      plugin: LoadedPlugin
      pendingEnable?: boolean
      pendingUpdate?: boolean
      pendingToggle?: 'will-enable' | 'will-disable'
    }
  | {
      type: 'mcp'
      id: string
      name: string
      description?: string
      scope: ConfigScope
      status: string
      client: MCPServerConnection
      indented?: boolean
    }
  | {
      type: 'failed-plugin'
      id: string
      name: string
      marketplace: string
      scope: string
      errorCount: number
      errors: PluginError[]
    }
  | {
      type: 'flagged-plugin'
      id: string
      name: string
      marketplace: string
      scope: string
      reason: string
      text: string
      flaggedAt: string
    }
