// Stub: services/contextCollapse/index.ts
export function initContextCollapse(): void {}

export function resetContextCollapse(): void {}

export function isContextCollapseEnabled(): boolean {
  return false
}

export function getStats(): {
  collapsedSpans: number
  collapsedMessages: number
  stagedSpans: number
  health: {
    totalErrors: number
    totalEmptySpawns: number
    emptySpawnWarningEmitted: boolean
    totalSpawns: number
    lastError?: string
  }
} {
  return {
    collapsedSpans: 0,
    collapsedMessages: 0,
    stagedSpans: 0,
    health: { totalErrors: 0, totalEmptySpawns: 0, emptySpawnWarningEmitted: false, totalSpawns: 0 },
  }
}

export function subscribe(_callback: () => void): () => void {
  return () => {}
}

export async function applyCollapsesIfNeeded(
  _messages: any[],
  _toolUseContext?: any,
  _querySource?: string,
): Promise<{ messages: any[] }> {
  return { messages: _messages }
}

export function isWithheldPromptTooLong(
  _message: any,
  _isPromptTooLong: ((msg: any) => boolean) | boolean,
  _querySource: string,
): boolean {
  return false
}

export function recoverFromOverflow(
  _messages: any[],
  _querySource: string,
): { messages: any[]; committed: number } {
  return { messages: _messages, committed: 0 }
}
