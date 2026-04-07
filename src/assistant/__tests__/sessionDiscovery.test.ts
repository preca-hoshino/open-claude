import { describe, expect, it } from 'bun:test';
import { discoverAssistantSessions } from '../sessionDiscovery';

describe('sessionDiscovery', () => {
  describe('discoverAssistantSessions', () => {
    it('should return empty array', async () => {
      const result = await discoverAssistantSessions();
      expect(result).toEqual([]);
    });
  });
});
