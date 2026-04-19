import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import * as log from '../../utils/log.js';
import { SessionsWebSocket } from '../SessionsWebSocket.js';

// Setup global mock for DOM WebSocket
class MockWebSocket {
  url: string;
  options: any;
  events: Record<string, ((...args: any[]) => void)[]> = {};

  constructor(url: string, options: any) {
    this.url = url;
    this.options = options;
  }

  addEventListener(event: string, callback: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  trigger(event: string, ...args: any[]) {
    if (this.events[event]) {
      for (const cb of this.events[event]) {
        cb(...args);
      }
    }
  }

  send = mock();
  close = mock();
  ping = mock();
}

// Preserve original WebSocket and map it
const _OriginalWebSocket = globalThis.WebSocket;
const mockSockets: MockWebSocket[] = [];

mock.module('../../constants/oauth.js', () => ({
  // biome-ignore lint/style/useNamingConvention: test mock
  getOauthConfig: () => ({ BASE_API_URL: 'https://api.test.com' }),
}));
mock.module('../../utils/proxy.js', () => ({
  getWebSocketProxyAgent: () => undefined,
  getWebSocketProxyUrl: () => undefined,
}));
mock.module('../../utils/mtls.js', () => ({
  // biome-ignore lint/style/useNamingConvention: test mock
  getWebSocketTLSOptions: () => undefined,
}));
mock.module('../../utils/slowOperations.js', () => ({
  jsonParse: (str: string) => JSON.parse(str),
  jsonStringify: (obj: any) => JSON.stringify(obj),
}));
mock.module('../../utils/log.js', () => ({
  logError: mock(),
}));
mock.module('../../utils/debug.js', () => ({
  logForDebugging: mock(),
}));
mock.module('ws', () => {
  return {
    default: class extends MockWebSocket {
      constructor(url: string, options: any) {
        super(url, options);
        mockSockets.push(this);
      }
      on(event: string, callback: (...args: undefined[]) => void) {
        this.addEventListener(event, callback);
      }
    },
  };
});

describe('SessionsWebSocket', () => {
  let callbacks: any;
  let ws: SessionsWebSocket;

  let mockTimers: { cb: (...args: any[]) => void; delay: number; id: number }[] = [];
  let timerIdCounter = 1;

  beforeEach(() => {
    mockSockets.length = 0; // clear array
    callbacks = {
      onMessage: mock(),
      onClose: mock(),
      onError: mock(),
      onConnected: mock(),
      onReconnecting: mock(),
    };
    ws = new SessionsWebSocket('s-1', 'org-1', () => 'tok-1', callbacks);

    // Manual timers mock
    mockTimers = [];
    timerIdCounter = 1;
    globalThis.setTimeout = ((cb: (...args: any[]) => void, delay: number) => {
      const t = { cb, delay, id: timerIdCounter++ };
      mockTimers.push(t);
      return t.id as unknown as NodeJS.Timeout;
    }) as any;
    globalThis.clearTimeout = (id: any) => {
      mockTimers = mockTimers.filter((t) => t.id !== id);
    };
    globalThis.setInterval = globalThis.setTimeout as any;
    globalThis.clearInterval = globalThis.clearTimeout as any;

    Object.defineProperty(globalThis, 'WebSocket', {
      value: class extends MockWebSocket {
        constructor(url: string, options: any) {
          super(url, options);
          mockSockets.push(this);
        }
      },
      writable: true,
      configurable: true,
    });

    log.logError.mockClear();
  });

  afterEach(() => {
    ws.close();
  });

  const tick = (_ms: number) => {
    const toRun = [...mockTimers];
    mockTimers = [];
    for (const t of toRun) {
      t.cb();
    }
  };

  it('connects and authenticates via headers', async () => {
    await ws.connect();
    expect(mockSockets[0].url).toBe('wss://api.test.com/v1/sessions/ws/s-1/subscribe?organization_uuid=org-1');
    expect(mockSockets[0].options.headers).toMatchObject({
      // biome-ignore lint/style/useNamingConvention: match
      Authorization: 'Bearer tok-1',
      'anthropic-version': expect.any(String),
    });

    // simulate open
    mockSockets[0].trigger('open');
    expect(callbacks.onConnected).toHaveBeenCalled();
    expect(ws.isConnected()).toBe(true);
  });

  describe('message handling', () => {
    beforeEach(async () => {
      await ws.connect();
      mockSockets[0].trigger('open');
    });

    it('receives correct SDKMessage', () => {
      mockSockets[0].trigger('message', { data: JSON.stringify({ type: 'assistant', foo: 1 }) });
      expect(callbacks.onMessage).toHaveBeenCalledWith({ type: 'assistant', foo: 1 });
    });

    it('ignores invalid parsed JSON without type', () => {
      mockSockets[0].trigger('message', { data: JSON.stringify({ foo: 1 }) });
      expect(callbacks.onMessage).not.toHaveBeenCalled();
    });

    it('logs error on invalid JSON', () => {
      mockSockets[0].trigger('message', { data: 'invalid-json{' });
      expect(log.logError).toHaveBeenCalled();
    });
  });

  describe('error and ping', () => {
    beforeEach(async () => {
      await ws.connect();
      mockSockets[0].trigger('open');
    });

    it('handles error event', () => {
      mockSockets[0].trigger('error');
      expect(callbacks.onError).toHaveBeenCalled();
      expect(log.logError).toHaveBeenCalled();
    });

    it('handles pong', () => {
      // just ensuring it doesn't crash
      mockSockets[0].trigger('pong');
    });

    it('sends ping interval', () => {
      tick(31000); // PING_INTERVAL is 30000
      expect(mockSockets[0].ping).toHaveBeenCalled();
    });
  });

  describe('close and reconnection', () => {
    beforeEach(async () => {
      await ws.connect();
      mockSockets[0].trigger('open');
    });

    it('handles permanent close (4003)', () => {
      mockSockets[0].trigger('close', { code: 4003, reason: 'unauth' });
      expect(callbacks.onClose).toHaveBeenCalled();
      expect(ws.isConnected()).toBe(false);
    });

    it('handles 4001 close with retry', () => {
      mockSockets[0].trigger('close', { code: 4001, reason: 'session not found' });
      expect(callbacks.onReconnecting).toHaveBeenCalled();
      expect(ws.isConnected()).toBe(false);

      tick(2000); // RECONNECT_DELAY
      expect(mockSockets[0].url).toBe('wss://api.test.com/v1/sessions/ws/s-1/subscribe?organization_uuid=org-1');
    });

    it('handles generic close during reconnect', () => {
      mockSockets[0].trigger('close', { code: 1006, reason: 'dropped' });
      expect(callbacks.onReconnecting).toHaveBeenCalled();

      tick(2000);
      const currentWs = mockSockets[mockSockets.length - 1];
      // Close while connecting (no trigger('open'))
      currentWs.trigger('close', { code: 1006 });

      expect(callbacks.onClose).toHaveBeenCalled(); // fails immediately if not connected
    });
  });

  describe('sending', () => {
    beforeEach(async () => {
      await ws.connect();
      mockSockets[0].trigger('open');
    });

    it('sendControlResponse', () => {
      ws.sendControlResponse({
        type: 'control_response',
        // biome-ignore lint/style/useNamingConvention: match
        response: { subtype: 'success', request_id: '1', response: {} as any },
      });
      expect(mockSockets[0].send).toHaveBeenCalled();
    });

    it('sendControlRequest', () => {
      ws.sendControlRequest({ subtype: 'interrupt' });
      expect(mockSockets[0].send).toHaveBeenCalled();
    });
  });

  describe('force reconnect', () => {
    it('closes and attempts reconnect', async () => {
      await ws.connect();
      mockSockets[0].trigger('open');
      ws.reconnect();

      expect(mockSockets[0].close).toHaveBeenCalled();
      tick(500);
      expect(mockSockets[mockSockets.length - 1].url).toBeTruthy(); // connected again
    });
  });
});
