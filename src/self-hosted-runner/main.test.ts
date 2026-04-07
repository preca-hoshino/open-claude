import { describe, expect, it } from 'bun:test';
import { selfHostedRunnerMain } from './main';

describe('self-hosted-runner', () => {
  describe('selfHostedRunnerMain', () => {
    it('should throw "not implemented" error when called', async () => {
      await expect(selfHostedRunnerMain(['arg1', 'arg2'])).rejects.toThrow('self-hosted-runner stub: not implemented');
    });
  });
});
