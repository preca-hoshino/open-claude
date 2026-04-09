import { describe, expect, it } from 'bun:test';
import { getCoordinatorAgents } from '../workerAgent.js';

describe('workerAgent', () => {
  describe('getCoordinatorAgents', () => {
    it('should return an empty array', () => {
      const result = getCoordinatorAgents();
      expect(result).toEqual([]);
    });
  });
});
