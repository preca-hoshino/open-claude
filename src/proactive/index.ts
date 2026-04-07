// Stub: proactive/index.ts
export function isProactiveActive(): boolean {
  return false
}

export function isProactivePaused(): boolean {
  return false
}

export function activateProactive(_source: string): void {}

export function deactivateProactive(): void {}

export function pauseProactive(): void {}

export function setContextBlocked(_blocked: boolean): void {}

export function subscribeToProactiveChanges(_callback: () => void): () => void {
  return () => {}
}
