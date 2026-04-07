// Stub: services/compact/snipCompact.ts
export function isSnipRuntimeEnabled(): boolean {
  return false
}

export function isSnipMarkerMessage(_message: any): boolean {
  return false
}

export function snipCompactIfNeeded(_messages: any[], _options?: any): {
  messages: any[]
  tokensFreed: number
  boundaryMessage?: any
} {
  return { messages: _messages, tokensFreed: 0 }
}

export function shouldNudgeForSnips(_messages: any[]): boolean {
  return false
}

export const SNIP_NUDGE_TEXT = ''
