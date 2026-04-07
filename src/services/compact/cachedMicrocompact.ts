// Stub: services/compact/cachedMicrocompact.ts
export interface CachedMCState {
  [key: string]: any
}

export interface CacheEditsBlock {
  [key: string]: any
}

export interface PinnedCacheEdits {
  [key: string]: any
}

export function createCachedMCState(): CachedMCState {
  return {}
}

export function resetCachedMCState(_state: CachedMCState): void {}

export function createCacheEditsBlock(_state: CachedMCState, _toolsToDelete: any): CacheEditsBlock {
  return {}
}

export function isModelSupportedForCacheEditing(_model: string): boolean {
  return false
}

export function getCachedMCConfig(): any {
  return null
}

export function isCachedMicrocompactEnabled(): boolean {
  return false
}

export function markToolsSentToAPI(_state: CachedMCState, _toolIds?: any): void {}

export function registerToolResult(_state: CachedMCState, _toolUseId: string, _result?: any): void {}

export function registerToolMessage(_state: CachedMCState, _message: any): void {}

export function getToolResultsToDelete(_state: CachedMCState): string[] {
  return []
}
