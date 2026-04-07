import { afterEach, describe, expect, it, mock } from 'bun:test';
import * as sessionHistory from '../sessionHistory';

// Mock dependencies
mock.module('axios', () => {
  return {
    default: {
      get: mock(),
    },
  };
});

mock.module('../../constants/oauth.js', () => ({
  // biome-ignore lint/style/useNamingConvention: mock external schema
  getOauthConfig: mock(() => ({ BASE_API_URL: 'https://api.test.com' })),
}));

mock.module('../../utils/debug.js', () => ({
  logForDebugging: mock(),
}));

mock.module('../../utils/teleport/api.js', () => ({
  // biome-ignore lint/style/useNamingConvention: mock external schema
  getOAuthHeaders: mock((token) => ({ Authorization: `Bearer ${token}` })),
  // biome-ignore lint/style/useNamingConvention: mock external schema
  prepareApiRequest: mock(async () => await Promise.resolve({ accessToken: 'test-token', orgUUID: 'org-123' })),
}));

// Import the mocked modules to assert on them later
import axios from 'axios';
import { getOauthConfig } from '../../constants/oauth.js';
import { logForDebugging } from '../../utils/debug.js';
import { getOAuthHeaders, prepareApiRequest } from '../../utils/teleport/api.js';

describe('sessionHistory', () => {
  afterEach(() => {
    mock.restore(); // reset mock state
  });

  describe('createHistoryAuthCtx', () => {
    it('should prepare api request and return context configuration', async () => {
      const ctx = await sessionHistory.createHistoryAuthCtx('session-123');
      expect(prepareApiRequest).toHaveBeenCalled();
      expect(getOauthConfig).toHaveBeenCalled();
      expect(getOAuthHeaders).toHaveBeenCalledWith('test-token');

      expect(ctx.baseUrl).toBe('https://api.test.com/v1/sessions/session-123/events');
      expect(ctx.headers).toEqual({
        // biome-ignore lint/style/useNamingConvention: mock external schema
        Authorization: 'Bearer test-token',
        'anthropic-beta': 'ccr-byoc-2025-07-29',
        'x-organization-uuid': 'org-123',
      });
    });
  });

  describe('fetchLatestEvents', () => {
    const mockCtx = {
      baseUrl: 'https://fake.url',
      // biome-ignore lint/style/useNamingConvention: mock external schema
      headers: { Auth: 'Token' },
    };

    it('should fetch page with appropriate params', async () => {
      // Mock axios response
      (axios.get as import('bun:test').Mock<(...args: unknown[]) => Promise<unknown>>).mockResolvedValue({
        status: 200,
        data: {
          data: [{ id: 'msg-1' }],
          // biome-ignore lint/style/useNamingConvention: mock external schema
          has_more: true,
          // biome-ignore lint/style/useNamingConvention: mock external schema
          first_id: 'msg-1',
          // biome-ignore lint/style/useNamingConvention: mock external schema
          last_id: 'msg-1',
        },
      });

      const result = await sessionHistory.fetchLatestEvents(mockCtx, 50);

      expect(axios.get).toHaveBeenCalledWith('https://fake.url', {
        // biome-ignore lint/style/useNamingConvention: mock external schema
        headers: { Auth: 'Token' },
        // biome-ignore lint/style/useNamingConvention: mock external schema
        params: { limit: 50, anchor_to_latest: true },
        timeout: 15000,
        validateStatus: expect.any(Function),
      });

      expect(result).toMatchObject({
        events: [{ id: 'msg-1' }],
        firstId: 'msg-1',
        hasMore: true,
      });

      // also check validateStatus coverage
      const validateStatusFn = (
        (axios.get as import('bun:test').Mock<(...args: unknown[]) => Promise<unknown>>).mock.calls[0]?.[1] as {
          validateStatus: () => boolean;
        }
      ).validateStatus;
      expect(validateStatusFn()).toBe(true);
    });

    it('should return null logs on error', async () => {
      (axios.get as import('bun:test').Mock<(...args: unknown[]) => Promise<unknown>>).mockRejectedValue(
        new Error('Network error')
      );

      const result = await sessionHistory.fetchLatestEvents(mockCtx);
      expect(result).toBeNull();
      expect(logForDebugging).toHaveBeenCalledWith('[fetchLatestEvents] HTTP error');
    });

    it('should return null on non-200 status', async () => {
      (axios.get as import('bun:test').Mock<(...args: unknown[]) => Promise<unknown>>).mockResolvedValue({
        status: 404,
      });

      const result = await sessionHistory.fetchLatestEvents(mockCtx);
      expect(result).toBeNull();
      expect(logForDebugging).toHaveBeenCalledWith('[fetchLatestEvents] HTTP 404');
    });

    it('should handle data not being an array gracefully', async () => {
      (axios.get as import('bun:test').Mock<(...args: unknown[]) => Promise<unknown>>).mockResolvedValue({
        status: 200,
        data: {
          data: null, // intentionally not an array
          // biome-ignore lint/style/useNamingConvention: mock external schema
          has_more: false,
          // biome-ignore lint/style/useNamingConvention: mock external schema
          first_id: null,
        },
      });

      const result = await sessionHistory.fetchLatestEvents(mockCtx);
      expect(result).toEqual({
        events: [],
        firstId: null,
        hasMore: false,
      });
    });
  });

  describe('fetchOlderEvents', () => {
    const mockCtx = {
      baseUrl: 'https://fake.url',
      // biome-ignore lint/style/useNamingConvention: mock external schema
      headers: { Auth: 'Token' },
    };

    it('should fetch older events with before_id', async () => {
      (axios.get as import('bun:test').Mock<(...args: unknown[]) => Promise<unknown>>).mockResolvedValue({
        status: 200,
        data: {
          data: [{ id: 'older-msg-1' }],
          // biome-ignore lint/style/useNamingConvention: mock external schema
          has_more: false,
          // biome-ignore lint/style/useNamingConvention: mock external schema
          first_id: 'older-msg-1',
          // biome-ignore lint/style/useNamingConvention: mock external schema
          last_id: 'older-msg-1',
        },
      });

      const result = await sessionHistory.fetchOlderEvents(mockCtx, 'cursor-123', 50);

      expect(axios.get).toHaveBeenCalledWith('https://fake.url', {
        // biome-ignore lint/style/useNamingConvention: mock external schema
        headers: { Auth: 'Token' },
        // biome-ignore lint/style/useNamingConvention: mock external schema
        params: { limit: 50, before_id: 'cursor-123' },
        timeout: 15000,
        validateStatus: expect.any(Function),
      });

      expect(result).toMatchObject({
        events: [{ id: 'older-msg-1' }],
        firstId: 'older-msg-1',
        hasMore: false,
      });
    });

    it('should use default PAGE_SIZE limitation when limit is not provided', async () => {
      (axios.get as import('bun:test').Mock<(...args: unknown[]) => Promise<unknown>>).mockResolvedValue({
        status: 200,
        data: {
          data: [],
          // biome-ignore lint/style/useNamingConvention: mock external schema
          has_more: false,
          // biome-ignore lint/style/useNamingConvention: mock external schema
          first_id: null,
          // biome-ignore lint/style/useNamingConvention: mock external schema
          last_id: null,
        },
      });

      await sessionHistory.fetchOlderEvents(mockCtx, 'cursor-123');

      expect(axios.get).toHaveBeenCalledWith('https://fake.url', {
        // biome-ignore lint/style/useNamingConvention: mock external schema
        headers: { Auth: 'Token' },
        // biome-ignore lint/style/useNamingConvention: mock external schema
        params: { limit: 100, before_id: 'cursor-123' }, // HISTORY_PAGE_SIZE = 100
        timeout: 15000,
        validateStatus: expect.any(Function),
      });
    });
  });
});
