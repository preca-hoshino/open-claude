export type McpOAuthTokenData = {
  serverName: string
  serverUrl: string
  accessToken: string
  expiresAt: number
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  scope?: string
  stepUpScope?: string
  discoveryState?: {
    authorizationServerUrl: string
    resourceMetadataUrl?: string
    resourceMetadata?: unknown
    authorizationServerMetadata?: unknown
  }
}

export type McpOAuthClientConfigEntry = {
  clientSecret: string
}

export type McpXaaIdpEntry = {
  idToken: string
  expiresAt: number
}

export type McpXaaIdpConfigEntry = {
  clientSecret: string
}

export type ClaudeAiOAuthData = {
  accessToken: string
  refreshToken: string
  expiresAt: number
  scopes?: string[]
  subscriptionType?: string | null
  rateLimitTier?: string | null
}

export type SecureStorageData = {
  mcpOAuth?: Record<string, McpOAuthTokenData>
  mcpOAuthClientConfig?: Record<string, McpOAuthClientConfigEntry>
  mcpXaaIdp?: Record<string, McpXaaIdpEntry>
  mcpXaaIdpConfig?: Record<string, McpXaaIdpConfigEntry>
  claudeAiOauth?: ClaudeAiOAuthData
  trustedDeviceToken?: string
  pluginSecrets?: Record<string, Record<string, unknown>>
}

export type SecureStorage = {
  name: string
  read(): SecureStorageData | null
  readAsync(): Promise<SecureStorageData | null>
  update(data: SecureStorageData): { success: boolean; warning?: string }
  delete(): boolean
}
