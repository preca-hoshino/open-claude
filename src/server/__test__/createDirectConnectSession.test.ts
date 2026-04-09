import { describe, expect, it, beforeEach, afterEach, spyOn } from 'bun:test';
import { createDirectConnectSession, DirectConnectError } from '../createDirectConnectSession.js';

describe('createDirectConnectSession', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('should successfully create a direct connect session', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        await Promise.resolve({
          // biome-ignore lint/style/useNamingConvention: matches API
          session_id: 'test-session-123',
          // biome-ignore lint/style/useNamingConvention: matches API
          ws_url: 'ws://localhost/session',
          // biome-ignore lint/style/useNamingConvention: matches API
          work_dir: '/work/dir',
        }),
    });

    const result = await createDirectConnectSession({
      serverUrl: 'http://localhost:8080',
      authToken: 'secret-token',
      cwd: '/test/cwd',
      dangerouslySkipPermissions: true,
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/sessions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer secret-token',
      },
      body: JSON.stringify({
        cwd: '/test/cwd',
        // biome-ignore lint/style/useNamingConvention: matches API
        dangerously_skip_permissions: true,
      }),
    });

    expect(result).toEqual({
      config: {
        serverUrl: 'http://localhost:8080',
        sessionId: 'test-session-123',
        wsUrl: 'ws://localhost/session',
        authToken: 'secret-token',
      },
      workDir: '/work/dir',
    });
  });

  it('should successfully create a session without optional parameters', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        await Promise.resolve({
          // biome-ignore lint/style/useNamingConvention: matches API
          session_id: 'test-session-123',
          // biome-ignore lint/style/useNamingConvention: matches API
          ws_url: 'ws://localhost/session',
        }),
    });

    const result = await createDirectConnectSession({
      serverUrl: 'http://localhost:8080',
      cwd: '/test/cwd',
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/sessions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        cwd: '/test/cwd',
      }),
    });

    expect(result).toEqual({
      config: {
        serverUrl: 'http://localhost:8080',
        sessionId: 'test-session-123',
        wsUrl: 'ws://localhost/session',
        authToken: undefined,
      },
      workDir: undefined,
    });
  });

  it('should throw DirectConnectError when fetch throws an error', async () => {
    fetchMock.mockRejectedValue(new Error('Network failure'));

    await expect(
      createDirectConnectSession({
        serverUrl: 'http://localhost:8080',
        cwd: '/test/cwd',
      })
    ).rejects.toThrow(DirectConnectError);

    await expect(
      createDirectConnectSession({
        serverUrl: 'http://localhost:8080',
        cwd: '/test/cwd',
      })
    ).rejects.toThrow(/Failed to connect to server at http:\/\/localhost:8080: Network failure/);
  });

  it('should throw DirectConnectError when response is not ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      createDirectConnectSession({
        serverUrl: 'http://localhost:8080',
        cwd: '/test/cwd',
      })
    ).rejects.toThrow(DirectConnectError);

    await expect(
      createDirectConnectSession({
        serverUrl: 'http://localhost:8080',
        cwd: '/test/cwd',
      })
    ).rejects.toThrow(/Failed to create session: 500 Internal Server Error/);
  });

  it('should throw DirectConnectError when response payload parsing fails', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        await Promise.resolve({
          // missing session_id and ws_url
        }),
    });

    await expect(
      createDirectConnectSession({
        serverUrl: 'http://localhost:8080',
        cwd: '/test/cwd',
      })
    ).rejects.toThrow(DirectConnectError);

    await expect(
      createDirectConnectSession({
        serverUrl: 'http://localhost:8080',
        cwd: '/test/cwd',
      })
    ).rejects.toThrow(/Invalid session response:/);
  });
});
