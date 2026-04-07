import { describe, expect, it } from 'bun:test';
import { classifyAndWriteState } from '../classifier';

describe('classifyAndWriteState', () => {
  it('should resolve without errors when given valid parameters', async () => {
    await expect(classifyAndWriteState('mockJobDir', [])).resolves.toBeUndefined();
  });

  it('should resolve without errors when jobDir is undefined', async () => {
    await expect(classifyAndWriteState(undefined, [])).resolves.toBeUndefined();
  });
});
