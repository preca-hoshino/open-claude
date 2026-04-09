import { describe, expect, it } from 'bun:test';
import { SessionManager } from '../sessionManager.js';

describe('sessionManager', () => {
  it('should initialize and have destroyAll method', async () => {
    const manager = new SessionManager();
    expect(manager).toBeInstanceOf(SessionManager);
    expect(typeof manager.destroyAll).toBe('function');

    // Call it to make sure it doesn't throw
    await expect(manager.destroyAll()).resolves.toBeUndefined();
  });
});
