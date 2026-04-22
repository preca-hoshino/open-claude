/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { afterEach, describe, expect, it, mock } from 'bun:test';
import type { SDKControlPermissionRequest } from '../../entrypoints/sdk/controlTypes.js';
import { createSyntheticAssistantMessage, createToolStub } from '../remotePermissionBridge.js';

mock.module('crypto', () => ({
  // biome-ignore lint/style/useNamingConvention: match sdk
  randomUUID: mock(() => 'mocked-uuid'),
}));

mock.module('../../utils/slowOperations.js', () => ({
  jsonStringify: mock((val) => JSON.stringify(val)),
}));

describe('remotePermissionBridge', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('createSyntheticAssistantMessage', () => {
    it('should create a synthetic assistant message with the correct structure', () => {
      const request: SDKControlPermissionRequest = {
        subtype: 'can_use_tool',
        // biome-ignore lint/style/useNamingConvention: match sdk
        tool_use_id: 'tool_123',
        // biome-ignore lint/style/useNamingConvention: match sdk
        tool_name: 'test_tool',
        input: { key: 'value' },
      };

      const message = createSyntheticAssistantMessage(request, 'req_123');

      expect(message).toEqual({
        type: 'assistant',
        uuid: 'mocked-uuid', // From mocked randomUUID
        message: {
          id: 'remote-req_123',
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tool_123',
              name: 'test_tool',
              input: { key: 'value' },
            },
          ],
          model: '',
          // biome-ignore lint/style/useNamingConvention: match sdk
          stop_reason: null,
          // biome-ignore lint/style/useNamingConvention: match sdk
          stop_sequence: null,
          container: null,
          // biome-ignore lint/style/useNamingConvention: match sdk
          context_management: null,
          usage: {
            // biome-ignore lint/style/useNamingConvention: match sdk
            input_tokens: 0,
            // biome-ignore lint/style/useNamingConvention: match sdk
            output_tokens: 0,
            // biome-ignore lint/style/useNamingConvention: match sdk
            cache_creation_input_tokens: 0,
            // biome-ignore lint/style/useNamingConvention: match sdk
            cache_read_input_tokens: 0,
          },
        },
        requestId: undefined,
        timestamp: expect.any(String),
      });
    });
  });

  describe('createToolStub', () => {
    it('should create a tool stub with correct fixed values', async () => {
      const tool = createToolStub('stub_tool');

      expect(tool.name).toBe('stub_tool');
      expect(tool.userFacingName()).toBe('stub_tool');
      expect(tool.isEnabled()).toBe(true);
      expect(tool.isReadOnly()).toBe(false);
      expect(tool.isMcp).toBe(false);
      expect(tool.needsPermissions()).toBe(true);
      await expect(tool.description()).resolves.toBe('');
      expect(tool.prompt()).toBe('');
      await expect(tool.call({} as any)).resolves.toEqual({ data: '' });
    });

    it('should render tool use message correctly', () => {
      const tool = createToolStub('stub_tool');

      // empty input
      expect(tool.renderToolUseMessage({})).toBe('');

      // string values
      expect(tool.renderToolUseMessage({ a: 'foo', b: 'bar' })).toBe('a: foo, b: bar');

      // object values should be stringified
      expect(tool.renderToolUseMessage({ obj: { x: 1 } })).toBe('obj: {"x":1}');

      // should limit to 3 items max
      const longInput = { a: 1, b: 2, c: 3, d: 4 };
      expect(tool.renderToolUseMessage(longInput)).toBe('a: 1, b: 2, c: 3');
    });
  });
});
