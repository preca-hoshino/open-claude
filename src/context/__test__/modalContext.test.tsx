/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, expect, it, mock } from 'bun:test';

const OriginalReact = await import('react');

let mockContextValue: any = null;

mock.module('react', () => {
  return {
    ...OriginalReact,
    useContext: () => mockContextValue,
  };
});

const memoArray = new Array(20).fill(Symbol.for('react.memo_cache_sentinel'));
mock.module('react/compiler-runtime', () => ({
  c: (_size: number) => memoArray,
}));

import { useIsInsideModal, useModalOrTerminalSize, useModalScrollRef } from '../modalContext.js';

describe('modalContext', () => {
  it('useIsInsideModal works', () => {
    mockContextValue = null;
    expect(useIsInsideModal()).toBe(false);

    mockContextValue = { rows: 10, columns: 20, scrollRef: null };
    expect(useIsInsideModal()).toBe(true);
  });

  it('useModalOrTerminalSize works', () => {
    // Clear array cache manually just in case
    memoArray.fill(Symbol.for('react.memo_cache_sentinel'));

    mockContextValue = null;
    expect(useModalOrTerminalSize({ rows: 5, columns: 10 })).toEqual({ rows: 5, columns: 10 });

    mockContextValue = { rows: 20, columns: 40, scrollRef: null };
    expect(useModalOrTerminalSize({ rows: 5, columns: 10 })).toEqual({ rows: 20, columns: 40 });

    // Hit React compiler cache
    expect(useModalOrTerminalSize({ rows: 5, columns: 10 })).toEqual({ rows: 20, columns: 40 });
  });

  it('useModalScrollRef works', () => {
    mockContextValue = null;
    expect(useModalScrollRef()).toBeNull();

    const ref = { current: null };
    mockContextValue = { rows: 10, columns: 20, scrollRef: ref };
    expect(useModalScrollRef()).toBe(ref);

    mockContextValue = { rows: 10, columns: 20, scrollRef: null };
    expect(useModalScrollRef()).toBeNull();
  });
});
