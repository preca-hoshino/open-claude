import { describe, expect, it } from 'bun:test';
import { daemonMain } from '../main';

describe('daemonMain', () => {
  it('should throw "daemon stub: not implemented" error', async () => {
    await expect(daemonMain([])).rejects.toThrow('daemon stub: not implemented');
  });
});
