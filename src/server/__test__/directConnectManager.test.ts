import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { DirectConnectSessionManager } from '../directConnectManager.js';

describe('DirectConnectSessionManager', () => {
  let callbacks: any;
  let wsMock: any;
  let OriginalWebSocket: any;
  let addEventListenerMock: any;
  let sendMock: any;
  let closeMock: any;

  beforeEach(() => {
    callbacks = {
      onMessage: mock(),
      onPermissionRequest: mock(),
      onConnected: mock(),
      onDisconnected: mock(),
      onError: mock(),
    };

    addEventListenerMock = mock();
    sendMock = mock();
    closeMock = mock();

    wsMock = {
      addEventListener: addEventListenerMock,
      send: sendMock,
      close: closeMock,
      readyState: 1, // WebSocket.OPEN
    };

    OriginalWebSocket = global.WebSocket;
    global.WebSocket = mock().mockImplementation(() => wsMock) as any;
    // @ts-expect-error mock readonly property
    global.WebSocket.OPEN = 1;
  });

  afterEach(() => {
    if (OriginalWebSocket !== undefined) {
      global.WebSocket = OriginalWebSocket;
    } else {
      (global as any).WebSocket = undefined;
    }
  });

  it('should initialize and connect correctly with authToken', () => {
    const config = {
      serverUrl: 'http://localhost',
      sessionId: 'test-session',
      wsUrl: 'ws://localhost',
      authToken: 'secret',
    };
    const manager = new DirectConnectSessionManager(config, callbacks);
    manager.connect();

    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost', {
      headers: { authorization: 'Bearer secret' },
    });

    expect(addEventListenerMock).toHaveBeenCalledWith('open', expect.any(Function));
    expect(addEventListenerMock).toHaveBeenCalledWith('message', expect.any(Function));
    expect(addEventListenerMock).toHaveBeenCalledWith('close', expect.any(Function));
    expect(addEventListenerMock).toHaveBeenCalledWith('error', expect.any(Function));

    // test open callback
    const openCb = addEventListenerMock.mock.calls.find((call: any[]) => call[0] === 'open')[1];
    openCb();
    expect(callbacks.onConnected).toHaveBeenCalled();

    // test close callback
    const closeCb = addEventListenerMock.mock.calls.find((call: any[]) => call[0] === 'close')[1];
    closeCb();
    expect(callbacks.onDisconnected).toHaveBeenCalled();

    // test error callback
    const errorCb = addEventListenerMock.mock.calls.find((call: any[]) => call[0] === 'error')[1];
    errorCb();
    expect(callbacks.onError).toHaveBeenCalled();
  });

  it('should handle unparseable messages gracefully', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    manager.connect();

    const messageCb = addEventListenerMock.mock.calls.find((call: any[]) => call[0] === 'message')[1];
    messageCb({ data: 'invalid json' });
    expect(callbacks.onMessage).not.toHaveBeenCalled();
  });

  it('should handle non-StdoutMessage gracefully', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    manager.connect();

    const messageCb = addEventListenerMock.mock.calls.find((call: any[]) => call[0] === 'message')[1];
    messageCb({
      data: JSON.stringify({ /* biome-ignore lint/style/useNamingConvention: matches API */ not_a_type: 123 }),
    });
    expect(callbacks.onMessage).not.toHaveBeenCalled();
  });

  it('should route can_use_tool permission requests', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    manager.connect();

    const messageCb = addEventListenerMock.mock.calls.find((call: any[]) => call[0] === 'message')[1];
    const req = {
      type: 'control_request',
      /* biome-ignore lint/style/useNamingConvention: matches API */ request_id: 'req1',
      request: { subtype: 'can_use_tool' },
    };
    messageCb({ data: JSON.stringify(req) });

    expect(callbacks.onPermissionRequest).toHaveBeenCalledWith(req.request, 'req1');
  });

  it('should respond with error to unsupported permission requests', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    manager.connect();

    const messageCb = addEventListenerMock.mock.calls.find((call: any[]) => call[0] === 'message')[1];
    const req = {
      type: 'control_request',
      /* biome-ignore lint/style/useNamingConvention: matches API */ request_id: 'req1',
      request: { subtype: 'unknown' },
    };
    messageCb({ data: JSON.stringify(req) });

    expect(sendMock).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'control_response',
        response: {
          subtype: 'error',
          /* biome-ignore lint/style/useNamingConvention: matches API */ request_id: 'req1',
          error: 'Unsupported control request subtype: unknown',
        },
      })
    );
  });

  it('should forward standard SDK messages', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    manager.connect();

    const messageCb = addEventListenerMock.mock.calls.find((call: any[]) => call[0] === 'message')[1];
    const msg = { type: 'assistant', message: 'hello' };
    messageCb({ data: JSON.stringify(msg) });

    expect(callbacks.onMessage).toHaveBeenCalledWith(msg);
  });

  it('should filter out internal protocol messages from onMessage callback', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    manager.connect();

    const messageCb = addEventListenerMock.mock.calls.find((call: any[]) => call[0] === 'message')[1];
    messageCb({ data: JSON.stringify({ type: 'control_response' }) });
    messageCb({ data: JSON.stringify({ type: 'keep_alive' }) });
    messageCb({ data: JSON.stringify({ type: 'control_cancel_request' }) });
    messageCb({ data: JSON.stringify({ type: 'streamlined_text' }) });
    messageCb({ data: JSON.stringify({ type: 'streamlined_tool_use_summary' }) });
    messageCb({ data: JSON.stringify({ type: 'system', subtype: 'post_turn_summary' }) });

    expect(callbacks.onMessage).not.toHaveBeenCalled();
  });

  it('should sendMessage successfully when connected', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    // Send fails if not connected
    expect(manager.sendMessage([{ type: 'text', text: 'hi' }])).toBe(false);

    manager.connect();
    expect(manager.sendMessage([{ type: 'text', text: 'hi' }])).toBe(true);

    expect(sendMock).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'text', text: 'hi' }],
        },
        /* biome-ignore lint/style/useNamingConvention: matches API */ parent_tool_use_id: null,
        session_id: '',
      })
    );
  });

  it('should send respondToPermissionRequest (allow) correctly', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    manager.connect();

    manager.respondToPermissionRequest('req1', { behavior: 'allow', updatedInput: { input: 'updated' } });
    expect(sendMock).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'control_response',
        response: {
          subtype: 'success',
          /* biome-ignore lint/style/useNamingConvention: matches API */ request_id: 'req1',
          response: { behavior: 'allow', updatedInput: { input: 'updated' } },
        },
      })
    );
  });

  it('should send respondToPermissionRequest (reject) correctly', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    manager.connect();

    manager.respondToPermissionRequest('req1', { behavior: 'deny', message: 'no' });
    expect(sendMock).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'control_response',
        response: {
          subtype: 'success',
          /* biome-ignore lint/style/useNamingConvention: matches API */ request_id: 'req1',
          response: { behavior: 'deny', message: 'no' },
        },
      })
    );
  });

  it('should not respondToPermissionRequest if disconnected', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    manager.respondToPermissionRequest('req1', { behavior: 'allow', updatedInput: {} });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('should sendInterrupt correctly', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    manager.sendInterrupt();
    expect(sendMock).not.toHaveBeenCalled();

    manager.connect();
    manager.sendInterrupt();
    const callArgs = sendMock.mock.calls[0][0];
    const parsed = JSON.parse(callArgs);
    expect(parsed.type).toBe('control_request');
    expect(parsed.request.subtype).toBe('interrupt');
    expect(typeof parsed.request_id).toBe('string');
  });

  it('should disconnect correctly', () => {
    const manager = new DirectConnectSessionManager(
      { serverUrl: 'http://localhost', sessionId: 's', wsUrl: 'ws://localhost' },
      callbacks
    );
    manager.connect();
    expect(manager.isConnected()).toBe(true);

    manager.disconnect();
    expect(closeMock).toHaveBeenCalled();
    expect(manager.isConnected()).toBe(false);
  });
});
