import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import * as log from '../../utils/log.js';
import * as teleportApi from '../../utils/teleport/api.js';
import type { RemoteSessionCallbacks, RemoteSessionConfig } from '../RemoteSessionManager.js';
import { createRemoteSessionConfig, RemoteSessionManager } from '../RemoteSessionManager.js';
import { SessionsWebSocket } from '../SessionsWebSocket.js';

let mockConnect: any;
let mockSendControlResponse: any;
let mockSendControlRequest: any;
let mockIsConnected: any;
let mockClose: any;
let mockReconnectWs: any;

function getCurrentWsConfig(manager: any) {
  return manager.websocket?.callbacks;
}

mock.module('../../utils/teleport/api.js', () => ({
  sendEventToRemoteSession: mock(async () => true),
}));

mock.module('../../utils/log.js', () => ({
  logError: mock(),
}));

mock.module('../../utils/debug.js', () => ({
  logForDebugging: mock(),
}));

describe('RemoteSessionManager', () => {
  beforeEach(() => {
    // @ts-expect-error
    teleportApi.sendEventToRemoteSession.mockClear();
    // @ts-expect-error
    log.logError.mockClear();
  });

  describe('createRemoteSessionConfig', () => {
    it('creates config with given parameters', () => {
      const getAccessToken = () => 'token';
      const config = createRemoteSessionConfig('s-1', getAccessToken, 'org-1', true, true);
      expect(config).toEqual({
        sessionId: 's-1',
        getAccessToken,
        orgUuid: 'org-1',
        hasInitialPrompt: true,
        viewerOnly: true,
      });
    });

    it('creates config with default optional parameters', () => {
      const getAccessToken = () => 'token';
      const config = createRemoteSessionConfig('s-1', getAccessToken, 'org-1');
      expect(config).toEqual({
        sessionId: 's-1',
        getAccessToken,
        orgUuid: 'org-1',
        hasInitialPrompt: false,
        viewerOnly: false,
      });
    });
  });

  describe('Manager operations', () => {
    let config: RemoteSessionConfig;
    let callbacks: Record<keyof RemoteSessionCallbacks, ReturnType<typeof mock>>;
    let manager: RemoteSessionManager;

    beforeEach(() => {
      config = createRemoteSessionConfig('s-1', () => 'tok', 'o-1');
      callbacks = {
        onMessage: mock(),
        onPermissionRequest: mock(),
        onPermissionCancelled: mock(),
        onConnected: mock(),
        onDisconnected: mock(),
        onReconnecting: mock(),
        onError: mock(),
      };
      manager = new RemoteSessionManager(config, callbacks as RemoteSessionCallbacks);

      mockConnect = spyOn(SessionsWebSocket.prototype, 'connect').mockImplementation(async () => {
        /* mock */
      });
      mockSendControlResponse = spyOn(SessionsWebSocket.prototype, 'sendControlResponse').mockImplementation(() => {
        /* mock */
      });
      mockSendControlRequest = spyOn(SessionsWebSocket.prototype, 'sendControlRequest').mockImplementation(() => {
        /* mock */
      });
      mockIsConnected = spyOn(SessionsWebSocket.prototype, 'isConnected').mockImplementation(() => true);
      mockClose = spyOn(SessionsWebSocket.prototype, 'close').mockImplementation(() => {
        /* mock */
      });
      mockReconnectWs = spyOn(SessionsWebSocket.prototype, 'reconnect').mockImplementation(() => {
        /* mock */
      });
    });

    afterEach(() => {
      mockConnect.mockRestore();
      mockSendControlResponse.mockRestore();
      mockSendControlRequest.mockRestore();
      mockIsConnected.mockRestore();
      mockClose.mockRestore();
      mockReconnectWs.mockRestore();
    });

    it('getSessionId returns session id', () => {
      expect(manager.getSessionId()).toBe('s-1');
    });

    it('connect initializes websocket and triggers callbacks', () => {
      manager.connect();
      expect(mockConnect).toHaveBeenCalled();
      expect(getCurrentWsConfig(manager)).toBeTruthy();

      // Trigger WS callbacks
      getCurrentWsConfig(manager).onConnected();
      expect(callbacks.onConnected).toHaveBeenCalled();

      getCurrentWsConfig(manager).onClose();
      expect(callbacks.onDisconnected).toHaveBeenCalled();

      getCurrentWsConfig(manager).onReconnecting();
      expect(callbacks.onReconnecting).toHaveBeenCalled();

      const err = new Error('ws error');
      getCurrentWsConfig(manager).onError(err);
      expect(log.logError).toHaveBeenCalledWith(err);
      expect(callbacks.onError).toHaveBeenCalledWith(err);
    });

    describe('message handling', () => {
      beforeEach(() => {
        manager.connect();
      });

      it('handles SDK message', () => {
        getCurrentWsConfig(manager).onMessage({ type: 'assistant', foo: 'bar' });
        expect(callbacks.onMessage).toHaveBeenCalledWith({ type: 'assistant', foo: 'bar' });
      });

      it('handles control_request can_use_tool', () => {
        const req = {
          type: 'control_request',
          // biome-ignore lint/style/useNamingConvention: match
          request_id: 'req-1',
          // biome-ignore lint/style/useNamingConvention: match
          request: { subtype: 'can_use_tool', tool_name: 'bash', tool_use_id: 't-1' },
        };
        getCurrentWsConfig(manager).onMessage(req);
        expect(callbacks.onPermissionRequest).toHaveBeenCalledWith(req.request, 'req-1');
      });

      it('handles control_request unknown subtype by sending error response', () => {
        const req = {
          type: 'control_request',
          // biome-ignore lint/style/useNamingConvention: match
          request_id: 'req-2',
          request: { subtype: 'unknown_stuff' },
        };
        getCurrentWsConfig(manager).onMessage(req);
        expect(mockSendControlResponse).toHaveBeenCalledWith({
          type: 'control_response',
          response: {
            subtype: 'error',
            // biome-ignore lint/style/useNamingConvention: match
            request_id: 'req-2',
            error: expect.stringContaining('Unsupported control request subtype'),
          },
        });
      });

      it('handles control_cancel_request', () => {
        // prepare pending request
        getCurrentWsConfig(manager).onMessage({
          type: 'control_request',
          // biome-ignore lint/style/useNamingConvention: match
          request_id: 'req-3',
          // biome-ignore lint/style/useNamingConvention: match
          request: { subtype: 'can_use_tool', tool_name: 'bash', tool_use_id: 't-2' },
        });

        // biome-ignore lint/style/useNamingConvention: match
        const cancelReq = { type: 'control_cancel_request', request_id: 'req-3' };
        getCurrentWsConfig(manager).onMessage(cancelReq);

        expect(callbacks.onPermissionCancelled).toHaveBeenCalledWith('req-3', 't-2');
      });

      it('handles control_response cleanly', () => {
        getCurrentWsConfig(manager).onMessage({ type: 'control_response', response: {} });
        expect(callbacks.onMessage).not.toHaveBeenCalled();
      });
    });

    describe('sendMessage', () => {
      it('sends message via teleport API successfully', async () => {
        const result = await manager.sendMessage({ type: 'message', message: {} } as any);
        expect(teleportApi.sendEventToRemoteSession).toHaveBeenCalledWith('s-1', expect.anything(), undefined);
        expect(result).toBe(true);
      });

      it('logs error if send fails', async () => {
        // @ts-expect-error
        teleportApi.sendEventToRemoteSession.mockImplementationOnce(async () => false);
        const result = await manager.sendMessage({ type: 'message', message: {} } as any);
        expect(log.logError).toHaveBeenCalled();
        expect(result).toBe(false);
      });
    });

    describe('respondToPermissionRequest', () => {
      beforeEach(() => {
        manager.connect();
      });

      it('logs error if no pending request', () => {
        manager.respondToPermissionRequest('non-existent', { behavior: 'allow', updatedInput: {} });
        expect(log.logError).toHaveBeenCalled();
      });

      it('sends allow response', () => {
        getCurrentWsConfig(manager).onMessage({
          type: 'control_request',
          // biome-ignore lint/style/useNamingConvention: match
          request_id: 'req-4',
          request: { subtype: 'can_use_tool' },
        });

        manager.respondToPermissionRequest('req-4', { behavior: 'allow', updatedInput: { a: 1 } });
        expect(mockSendControlResponse).toHaveBeenCalledWith({
          type: 'control_response',
          response: {
            subtype: 'success',
            // biome-ignore lint/style/useNamingConvention: match
            request_id: 'req-4',
            response: {
              behavior: 'allow',
              updatedInput: { a: 1 },
            },
          },
        });
      });

      it('sends deny response', () => {
        getCurrentWsConfig(manager).onMessage({
          type: 'control_request',
          // biome-ignore lint/style/useNamingConvention: match
          request_id: 'req-5',
          request: { subtype: 'can_use_tool' },
        });

        manager.respondToPermissionRequest('req-5', { behavior: 'deny', message: 'No' });
        expect(mockSendControlResponse).toHaveBeenCalledWith({
          type: 'control_response',
          response: {
            subtype: 'success',
            // biome-ignore lint/style/useNamingConvention: match
            request_id: 'req-5',
            response: {
              behavior: 'deny',
              message: 'No',
            },
          },
        });
      });
    });

    it('isConnected forwards check to websocket', () => {
      expect(manager.isConnected()).toBe(false); // Not connected yet, ws is null
      manager.connect();
      expect(manager.isConnected()).toBe(true);
    });

    it('cancelSession sends interrupt', () => {
      manager.connect();
      manager.cancelSession();
      expect(mockSendControlRequest).toHaveBeenCalledWith({ subtype: 'interrupt' });
    });

    it('disconnect closes ws and clears pending requests', () => {
      manager.connect();
      manager.disconnect();
      expect(mockClose).toHaveBeenCalled();
      // try resolving a pending request
      manager.respondToPermissionRequest('req-1', { behavior: 'allow', updatedInput: {} });
      expect(log.logError).toHaveBeenCalled(); // cleared, so it errs
    });

    it('reconnect forwards to ws', () => {
      manager.connect();
      manager.reconnect();
      expect(mockReconnectWs).toHaveBeenCalled();
    });
  });
});
