import { describe, expect, it } from 'bun:test';
import { DangerousBackend } from '../dangerousBackend.js';

describe('DangerousBackend', () => {
  it('should initialize successfully', () => {
    const backend = new DangerousBackend();
    expect(backend).toBeInstanceOf(DangerousBackend);
  });
});
