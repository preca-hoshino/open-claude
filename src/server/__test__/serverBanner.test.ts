import { describe, expect, it } from 'bun:test';
import { printBanner } from '../serverBanner.js';

describe('serverBanner', () => {
  it('should not throw when printBanner is called', () => {
    expect(() => {
      printBanner({}, 'token', 8080);
    }).not.toThrow();
  });

  it('should not throw when printBanner is called without optional arguments', () => {
    expect(() => {
      printBanner({});
    }).not.toThrow();
  });
});
