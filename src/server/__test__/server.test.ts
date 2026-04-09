import { describe, expect, it } from 'bun:test';
import { startServer } from '../server.js';

describe('server', () => {
  it('should throw Error', async () => {
    await expect(startServer({})).rejects.toThrow('server stub: not implemented');
  });
});
