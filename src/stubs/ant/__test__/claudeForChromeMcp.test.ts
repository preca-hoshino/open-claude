import { describe, expect, it } from 'bun:test';
import { BROWSER_TOOLS, createClaudeForChromeMcpServer } from '../claudeForChromeMcp';

describe('claudeForChromeMcp', () => {
  describe('BROWSER_TOOLS', () => {
    it('should be an empty array', () => {
      expect(Array.isArray(BROWSER_TOOLS)).toBe(true);
      expect(BROWSER_TOOLS).toHaveLength(0);
    });
  });

  describe('createClaudeForChromeMcpServer', () => {
    it('should return an object with a connect function', () => {
      const server = createClaudeForChromeMcpServer({});
      expect(typeof server.connect).toBe('function');
    });

    it('connect function should throw an error', async () => {
      const server = createClaudeForChromeMcpServer({});
      await expect(server.connect({})).rejects.toThrow(
        'Claude in Chrome is unavailable in this source scaffold because @ant/claude-for-chrome-mcp is not published to the public npm registry.'
      );
    });
  });
});
