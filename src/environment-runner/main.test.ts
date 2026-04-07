import { describe, expect, it } from 'bun:test';
import { environmentRunnerMain } from './main';

describe('environment-runner', () => {
  describe('environmentRunnerMain', () => {
    it('should throw "not implemented" error when called', async () => {
      await expect(environmentRunnerMain(['arg1', 'arg2'])).rejects.toThrow('environment-runner stub: not implemented');
    });
  });
});
