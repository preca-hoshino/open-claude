import type { SSHSession } from './createSSHSession.js'

export interface SSHSessionManager {
  getSession(): SSHSession | undefined
  connect(host: string, options?: { port?: number; username?: string }): Promise<SSHSession>
  disconnect(): Promise<void>
  onPermissionRequest(handler: (request: any) => Promise<boolean>): void
  onStatusChange(handler: (status: string) => void): void
  onError(handler: (error: Error) => void): void
  dispose(): void
}
