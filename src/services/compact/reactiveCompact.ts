// Stub: services/compact/reactiveCompact.ts
export function isReactiveOnlyMode(): boolean {
  return false
}

export function isReactiveCompactEnabled(): boolean {
  return false
}

export function isWithheldPromptTooLong(_message: any): boolean {
  return false
}

export function isWithheldMediaSizeError(_message: any): boolean {
  return false
}

export async function tryReactiveCompact(_options: {
  hasAttempted: boolean
  querySource: string
  aborted: boolean
  messages: any[]
  cacheSafeParams: any
}): Promise<any> {
  return null
}

export async function reactiveCompactOnPromptTooLong(
  _messages: any[],
  _cacheSafeParams: any,
  _options: { customInstructions: string; trigger: string },
): Promise<any> {
  throw new Error('reactiveCompact stub: not implemented')
}
