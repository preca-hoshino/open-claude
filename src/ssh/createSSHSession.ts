export interface SSHSession {
  host: string
  port: number
  username: string
  connected: boolean
  proc: { exitCode: number | null; signalCode: string | null }
  proxy: { stop(): void }
  connect(): Promise<void>
  disconnect(): Promise<void>
  execute(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }>
  createManager(options: {
    onMessage: (message: any) => void
    onPermissionRequest: (request: any, requestId: string) => void
    onConnected: () => void
    onReconnecting: (attempt: number, max: number) => void
    onDisconnected: () => void
    onError: (error: Error) => void
  }): {
    connect(): void
    disconnect(): void
    sendMessage(content: any): Promise<boolean>
    cancelRequest(): void
    respondToPermissionRequest(requestId: string, response: any): void
  }
  getStderrTail(): string
}

export class SSHSessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SSHSessionError'
  }
}

export async function createSSHSession(
  _options: string | {
    host: string
    cwd?: string
    localVersion?: string
    permissionMode?: string
    dangerouslySkipPermissions?: boolean
    extraCliArgs?: string[]
    port?: number
    username?: string
    [key: string]: unknown
  },
  _extraOptions?: { port?: number; username?: string; onProgress?: (msg: string) => void; [key: string]: unknown },
): Promise<SSHSession> {
  throw new SSHSessionError('SSH sessions not available in source build')
}

export async function createLocalSSHSession(_options?: any): Promise<SSHSession> {
  throw new SSHSessionError('SSH sessions not available in source build')
}
