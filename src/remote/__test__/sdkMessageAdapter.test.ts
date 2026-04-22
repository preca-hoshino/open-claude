/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, expect, it } from 'bun:test';
import type {
  SDKAssistantMessage,
  SDKCompactBoundaryMessage,
  SDKPartialAssistantMessage,
  SDKResultMessage,
  SDKStatusMessage,
  SDKSystemMessage,
  SDKToolProgressMessage,
} from '../../entrypoints/agentSdkTypes.js';
import { convertSDKMessage, getResultText, isSessionEndMessage, isSuccessResult } from '../sdkMessageAdapter.js';

describe('sdkMessageAdapter', () => {
  describe('convertSDKMessage', () => {
    it('should convert assistant correctly', () => {
      const msg: SDKAssistantMessage = {
        type: 'assistant',
        uuid: 'uuid-1',
        message: { id: 'm-1', role: 'assistant', content: [] } as any,
        timestamp: '2022-01-01',
      };
      const converted = convertSDKMessage(msg);
      expect(converted.type).toBe('message');
      if (converted.type !== 'message') {
        throw new Error('wtf'); // type guard
      }
      expect(converted.message).toMatchObject({
        type: 'assistant',
        uuid: 'uuid-1',
        error: undefined,
        message: msg.message,
      });
    });

    it('should convert user text messages when opts specify convertUserTextMessages', () => {
      const msg: any = {
        type: 'user',
        uuid: 'uuid-2',
        message: { id: 'm-2', role: 'user', content: 'hello' },
        timestamp: '2022-01-01',
      };
      const converted = convertSDKMessage(msg, { convertUserTextMessages: true });
      expect(converted.type).toBe('message');
      if (converted.type === 'message') {
        expect(converted.message).toMatchObject({
          type: 'user',
          uuid: 'uuid-2',
        });
      }
    });

    it('should ignore user text messages by default', () => {
      const msg: any = {
        type: 'user',
        uuid: 'uuid-3',
        message: { id: 'm-3', role: 'user', content: 'hello' },
        timestamp: '2022-01-01',
      };
      const converted = convertSDKMessage(msg);
      expect(converted.type).toBe('ignored');
    });

    it('should convert user tool result messages when opts specify convertToolResults', () => {
      const msg: any = {
        type: 'user',
        uuid: 'uuid-4',
        // biome-ignore lint/style/useNamingConvention: match sdk
        message: { id: 'm-4', role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tool-1', content: 'bar' }] },
        timestamp: '2022-01-01',
      };
      const converted = convertSDKMessage(msg, { convertToolResults: true });
      expect(converted.type).toBe('message');
      if (converted.type === 'message') {
        expect(converted.message).toMatchObject({
          type: 'user',
          uuid: 'uuid-4',
        });
      }
    });

    it('should ignore user tool result messages by default', () => {
      const msg: any = {
        type: 'user',
        uuid: 'uuid-5',
        // biome-ignore lint/style/useNamingConvention: match sdk
        message: { id: 'm-5', role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tool-2', content: 'baz' }] },
        timestamp: '2022-01-01',
      };
      const converted = convertSDKMessage(msg);
      expect(converted.type).toBe('ignored');
    });

    it('should convert stream_event correctly', () => {
      const msg: SDKPartialAssistantMessage = {
        type: 'stream_event',
        event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'hi' } } as any,
      };
      const converted = convertSDKMessage(msg);
      expect(converted.type).toBe('stream_event');
    });

    it('should convert non-success result into warning system message', () => {
      const msg: SDKResultMessage = {
        type: 'result',
        subtype: 'error',
        uuid: 'uuid-result',
        errors: ['Error 1'],
      };
      const converted = convertSDKMessage(msg);
      expect(converted).toMatchObject({
        type: 'message',
        message: {
          type: 'system',
          level: 'warning',
          content: 'Error 1',
        },
      });
    });

    it('should ignore success result message', () => {
      const msg: SDKResultMessage = {
        type: 'result',
        subtype: 'success',
        uuid: 'uuid-result-2',
        result: 'ok',
      };
      expect(convertSDKMessage(msg).type).toBe('ignored');
    });

    it('should convert system init message', () => {
      const msg: SDKSystemMessage = {
        type: 'system',
        subtype: 'init',
        uuid: 'sys-1',
        model: 'model-a',
      };
      const converted = convertSDKMessage(msg);
      expect(converted).toMatchObject({
        type: 'message',
        message: {
          type: 'system',
          subtype: 'informational',
          content: 'Remote session initialized (model: model-a)',
        },
      });
    });

    it('should convert system status compacting message', () => {
      const msg: SDKStatusMessage = {
        type: 'system',
        subtype: 'status',
        uuid: 'sys-2',
        status: 'compacting',
      };
      const converted = convertSDKMessage(msg);
      expect(converted).toMatchObject({
        type: 'message',
        message: {
          type: 'system',
          subtype: 'informational',
          content: 'Compacting conversation…',
        },
      });
    });

    it('should ignore system status without status field', () => {
      const msg: SDKStatusMessage = {
        type: 'system',
        subtype: 'status',
        uuid: 'sys-3',
        status: undefined,
      };
      expect(convertSDKMessage(msg).type).toBe('ignored');
    });

    it('should convert tool progress message', () => {
      const msg: SDKToolProgressMessage = {
        type: 'tool_progress',
        // biome-ignore lint/style/useNamingConvention: match sdk
        tool_name: 'bash',
        // biome-ignore lint/style/useNamingConvention: match sdk
        tool_use_id: 'tool-1',
        // biome-ignore lint/style/useNamingConvention: match sdk
        elapsed_time_seconds: 5,
        uuid: 'tp-1',
        // biome-ignore lint/style/useNamingConvention: match sdk
        session_id: 'sess-1',
      };
      const converted = convertSDKMessage(msg);
      expect(converted).toMatchObject({
        type: 'message',
        message: {
          type: 'system',
          content: 'Tool bash running for 5s…',
          // biome-ignore lint/style/useNamingConvention: match sdk
          toolUseID: 'tool-1',
        },
      });
    });

    it('should convert compact_boundary message', () => {
      const msg: SDKCompactBoundaryMessage = {
        type: 'system',
        subtype: 'compact_boundary',
        uuid: 'cb-1',
        // biome-ignore lint/style/useNamingConvention: match sdk
        compact_metadata: {
          trigger: 'manual',
          // biome-ignore lint/style/useNamingConvention: match sdk
          pre_tokens: 10,
        },
      };
      const converted = convertSDKMessage(msg);
      expect(converted.type).toBe('message');
    });

    it('should ignore other unknown system subytpes', () => {
      const msg: any = { type: 'system', subtype: 'unknown', uuid: 'x' };
      expect(convertSDKMessage(msg).type).toBe('ignored');
    });

    it('should ignore auth_status, tool_use_summary, rate_limit_event and unknown types', () => {
      expect(convertSDKMessage({ type: 'auth_status' } as any).type).toBe('ignored');
      expect(convertSDKMessage({ type: 'tool_use_summary' } as any).type).toBe('ignored');
      expect(convertSDKMessage({ type: 'rate_limit_event' } as any).type).toBe('ignored');
      expect(convertSDKMessage({ type: 'completely_unknown' } as any).type).toBe('ignored');
    });
  });

  describe('isSessionEndMessage', () => {
    it('should return true for result type messages', () => {
      expect(isSessionEndMessage({ type: 'result' } as any)).toBe(true);
      expect(isSessionEndMessage({ type: 'assistant' } as any)).toBe(false);
    });
  });

  describe('isSuccessResult', () => {
    it('should return true for success result messages', () => {
      expect(isSuccessResult({ type: 'result', subtype: 'success' } as any)).toBe(true);
      expect(isSuccessResult({ type: 'result', subtype: 'error' } as any)).toBe(false);
    });
  });

  describe('getResultText', () => {
    it('should return text for success', () => {
      expect(getResultText({ type: 'result', subtype: 'success', result: 'hello done' } as any)).toBe('hello done');
      expect(getResultText({ type: 'result', subtype: 'error' } as any)).toBe(null);
    });
  });
});
