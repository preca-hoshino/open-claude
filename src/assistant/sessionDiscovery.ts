export type AssistantSession = {
  id: string
  name?: string
  status?: string
  createdAt?: string
  environment?: string
}

export async function discoverAssistantSessions(): Promise<AssistantSession[]> {
  // Discover available assistant sessions from bridge environments
  // Implementation stripped from npm distribution
  return []
}
