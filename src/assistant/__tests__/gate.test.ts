import { describe, expect, it } from 'bun:test';
import { isKairosEnabled } from '../gate';

describe('gate', () => {
  describe('isKairosEnabled', () => {
    it('should return false', async () => {
      const result = await isKairosEnabled();
      expect(result).toBeFalsy();
    });
  });
});
