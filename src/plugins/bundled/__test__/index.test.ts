import { describe, expect, it } from 'bun:test';
import { initBuiltinPlugins } from '../index.js';

describe('bundled/index', () => {
  it('initBuiltinPlugins should not throw', () => {
    expect(() => {
      initBuiltinPlugins();
    }).not.toThrow();
  });
});
