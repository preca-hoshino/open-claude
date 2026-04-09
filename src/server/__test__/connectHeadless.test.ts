import { describe, expect, it } from 'bun:test';
import { runConnectHeadless } from '../connectHeadless.js';

describe('connectHeadless', () => {
  it('should throw Error', async () => {
    await expect(runConnectHeadless({}, 'prompt', 'text', false)).rejects.toThrow(
      'connectHeadless stub: not implemented'
    );
  });
});
