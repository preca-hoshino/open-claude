import { describe, expect, it } from 'bun:test';
import { writeServerLock, removeServerLock, probeRunningServer } from '../lockfile.js';

describe('lockfile', () => {
  it('writeServerLock should not throw', async () => {
    await expect(writeServerLock({})).resolves.toBeUndefined();
  });

  it('removeServerLock should not throw', async () => {
    await expect(removeServerLock()).resolves.toBeUndefined();
  });

  it('probeRunningServer should return null', async () => {
    const result = await probeRunningServer();
    expect(result).toBeNull();
  });
});
