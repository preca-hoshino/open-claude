import { describe, expect, it, mock } from 'bun:test';
import * as React from 'react';

// Must import original React up here because mock.module happens first
const OriginalReact = await import('react');

let mockContextValue: any = undefined;

mock.module('react', () => {
  return {
    ...OriginalReact,
    useContext: () => mockContextValue,
  };
});

const memoArray = new Array(20).fill(Symbol.for("react.memo_cache_sentinel"));
mock.module('react/compiler-runtime', () => ({
  c: (size: number) => memoArray,
}));

import { FpsMetricsProvider, useFpsMetrics } from '../fpsMetrics.js';

describe('fpsMetrics', () => {
  it('FpsMetricsProvider provides context and hits cache', () => {
    const mockGetFpsMetrics = mock(() => ({ fps: 60 }));
    const children = 'test';
    const element1 = FpsMetricsProvider({
      getFpsMetrics: mockGetFpsMetrics as any,
      children,
    }) as any;

    expect(element1.type).toBeDefined();

    // Call again with same props to hit react compiler cache
    const element2 = FpsMetricsProvider({
      getFpsMetrics: mockGetFpsMetrics as any,
      children,
    }) as any;

    expect(element2).toEqual(element1);
  });

  it('useFpsMetrics gets context', () => {
    mockContextValue = undefined;
    expect(useFpsMetrics()).toBeUndefined();

    // With value
    const val = () => ({ fps: 120 });
    mockContextValue = val;
    expect(useFpsMetrics()).toBe(val);
  });
});
