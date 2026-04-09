import { describe, expect, it, mock } from 'bun:test';
import * as React from 'react';

const OriginalReact = await import('react');

let mockContextValue: any = null;
let effectFns: Function[] = [];
let layoutEffectFns: Function[] = [];

mock.module('react', () => {
  return {
    ...OriginalReact,
    useContext: () => mockContextValue,
    useEffect: (fn: Function) => effectFns.push(fn),
    useLayoutEffect: (fn: Function) => layoutEffectFns.push(fn),
  };
});

const memoArray = new Array(20).fill(Symbol.for("react.memo_cache_sentinel"));
mock.module('react/compiler-runtime', () => ({
  c: (size: number) => memoArray,
}));

let mockAppStateStore = new Set<string>();

mock.module('../../state/AppState.js', () => ({
  AppStoreContext: {},
  useAppState: (selector: Function) => {
    return selector({ activeOverlays: mockAppStateStore });
  }
}));

import { useRegisterOverlay, useIsOverlayActive, useIsModalOverlayActive } from '../overlayContext.js';

describe('overlayContext', () => {
  it('useRegisterOverlay works and registers/unregisters effects', () => {
    effectFns = [];
    layoutEffectFns = [];
    memoArray.fill(Symbol.for("react.memo_cache_sentinel"));
    
    // Test that when disabled it does nothing
    let prevActive = new Set(['other']);
    let setStateInjected = mock((setter: any) => {
      if (typeof setter === 'function') {
        prevActive = setter({ activeOverlays: prevActive }).activeOverlays;
      } else {
        prevActive = setter.activeOverlays;
      }
    });

    mockContextValue = { setState: setStateInjected };
    useRegisterOverlay('test-overlay', false);

    expect(effectFns.length).toBe(1);
    expect(layoutEffectFns.length).toBe(1);

    // Call effects
    const cleanup = effectFns[0]();
    expect(cleanup).toBeUndefined(); // disabled returns early

    const layoutCleanup = layoutEffectFns[0]();
    if (layoutCleanup) layoutCleanup(); // disabled returns early

    // Test when setAppState is missing
    effectFns = [];
    layoutEffectFns = [];
    memoArray.fill(Symbol.for("react.memo_cache_sentinel"));
    mockContextValue = {}; // no setState
    useRegisterOverlay('no-store', true);
    expect(effectFns[0]()).toBeUndefined();

    // Test enabled
    effectFns = [];
    layoutEffectFns = [];
    memoArray.fill(Symbol.for("react.memo_cache_sentinel"));
    
    setStateInjected = mock((setter: any) => {
      if (typeof setter === 'function') {
        prevActive = setter({ activeOverlays: prevActive }).activeOverlays;
      } else {
        prevActive = setter.activeOverlays;
      }
    });
    mockContextValue = { setState: setStateInjected };

    useRegisterOverlay('my-overlay', true);
    
    expect(effectFns.length).toBe(1);
    
    const cleanupEnabled = effectFns[0]();
    expect(prevActive.has('my-overlay')).toBe(true);

    // Test hitting the already-has branch
    setStateInjected({ activeOverlays: prevActive });

    // Test cleanup
    cleanupEnabled();
    expect(prevActive.has('my-overlay')).toBe(false);

    // Test cleanup hitting already-missing branch
    cleanupEnabled();
  });

  it('useIsOverlayActive works', () => {
    mockAppStateStore = new Set();
    expect(useIsOverlayActive()).toBe(false);

    mockAppStateStore = new Set(['some-overlay']);
    expect(useIsOverlayActive()).toBe(true);
  });

  it('useIsModalOverlayActive works', () => {
    mockAppStateStore = new Set();
    expect(useIsModalOverlayActive()).toBe(false);

    // Non-modal overlay
    mockAppStateStore = new Set(['autocomplete']);
    expect(useIsModalOverlayActive()).toBe(false);

    // Modal overlay
    mockAppStateStore = new Set(['some-modal']);
    expect(useIsModalOverlayActive()).toBe(true);

    // Mixed
    mockAppStateStore = new Set(['autocomplete', 'some-modal']);
    expect(useIsModalOverlayActive()).toBe(true);
  });
});
