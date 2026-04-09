import { describe, expect, it } from 'bun:test';
import { connectResponseSchema } from '../types.js';

describe('types', () => {
  describe('connectResponseSchema', () => {
    it('should parse valid full response', () => {
      const data = {
        // biome-ignore lint/style/useNamingConvention: matches API
        session_id: 'session-1',
        // biome-ignore lint/style/useNamingConvention: matches API
        ws_url: 'ws://localhost',
        // biome-ignore lint/style/useNamingConvention: matches API
        work_dir: '/work',
      };
      const result = connectResponseSchema().parse(data);
      expect(result).toEqual(data);
    });

    it('should parse valid response without optional work_dir', () => {
      const data = {
        // biome-ignore lint/style/useNamingConvention: matches API
        session_id: 'session-1',
        // biome-ignore lint/style/useNamingConvention: matches API
        ws_url: 'ws://localhost',
      };
      const result = connectResponseSchema().parse(data);
      expect(result).toEqual(data);
    });

    it('should fail on missing session_id', () => {
      const data = {
        // biome-ignore lint/style/useNamingConvention: matches API
        ws_url: 'ws://localhost',
      };
      const result = connectResponseSchema().safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail on missing ws_url', () => {
      const data = {
        // biome-ignore lint/style/useNamingConvention: matches API
        session_id: 'session-1',
      };
      const result = connectResponseSchema().safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
