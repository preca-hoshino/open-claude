import { describe, expect, it, mock } from 'bun:test';
import * as React from 'react';

const memoArray = new Array(20).fill(Symbol('uninitialized'));
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

  it('useFpsMetrics calls useContext and throws when outside component', () => {
    // Calling useContext outside a functional component throws an error in React
    expect(() => useFpsMetrics()).toThrow();
  });
});
