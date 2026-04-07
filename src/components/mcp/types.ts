import type {
  ConfigScope,
  MCPServerConnection,
  McpClaudeAIProxyServerConfig,
  McpHTTPServerConfig,
  McpSSEServerConfig,
  McpStdioServerConfig,
} from '../../services/mcp/types.js'

export type StdioServerInfo = {
  name: string
  client: MCPServerConnection
  scope: ConfigScope
  transport: 'stdio'
  config: McpStdioServerConfig
}

export type SSEServerInfo = {
  name: string
  client: MCPServerConnection
  scope: ConfigScope
  transport: 'sse'
  isAuthenticated?: boolean
  config: McpSSEServerConfig
}

export type HTTPServerInfo = {
  name: string
  client: MCPServerConnection
  scope: ConfigScope
  transport: 'http'
  isAuthenticated?: boolean
  config: McpHTTPServerConfig
}

export type ClaudeAIServerInfo = {
  name: string
  client: MCPServerConnection
  scope: ConfigScope
  transport: 'claudeai-proxy'
  isAuthenticated: boolean
  config: McpClaudeAIProxyServerConfig
}

export type ServerInfo =
  | StdioServerInfo
  | SSEServerInfo
  | HTTPServerInfo
  | ClaudeAIServerInfo

export type AgentMcpServerInfo =
  | {
      name: string
      sourceAgents: string[]
      transport: 'stdio'
      command: string
      url?: string
      needsAuth: boolean
      isAuthenticated?: boolean
    }
  | {
      name: string
      sourceAgents: string[]
      transport: 'sse'
      url: string
      command?: string
      needsAuth: boolean
      isAuthenticated?: boolean
    }
  | {
      name: string
      sourceAgents: string[]
      transport: 'http'
      url: string
      command?: string
      needsAuth: boolean
      isAuthenticated?: boolean
    }
  | {
      name: string
      sourceAgents: string[]
      transport: 'ws'
      url: string
      command?: string
      needsAuth: boolean
      isAuthenticated?: boolean
    }

export type MCPViewState =
  | { type: 'list'; defaultTab?: string }
  | { type: 'server-menu'; server: ServerInfo }
  | { type: 'agent-server-menu'; agentServer: AgentMcpServerInfo }
  | { type: 'server-tools'; server: ServerInfo }
  | { type: 'server-tool-detail'; server: ServerInfo; toolName: string }
