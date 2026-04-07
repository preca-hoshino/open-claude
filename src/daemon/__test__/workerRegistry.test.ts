import { describe, expect, it } from 'bun:test';
import { runDaemonWorker } from '../workerRegistry';

describe('runDaemonWorker', () => {
  it('should throw "workerRegistry stub: not implemented" error without args', async () => {
    await expect(runDaemonWorker()).rejects.toThrow('workerRegistry stub: not implemented');
  });

  it('should throw "workerRegistry stub: not implemented" error with workerId', async () => {
    await expect(runDaemonWorker('worker123')).rejects.toThrow('workerRegistry stub: not implemented');
  });
});
