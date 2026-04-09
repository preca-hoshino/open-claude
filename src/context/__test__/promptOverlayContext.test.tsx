import { describe, expect, it, mock } from 'bun:test';
import * as React from 'react';

const OriginalReact = await import('react');

let mockContextValue: any = null;
let effectFns: Function[] = [];

mock.module('react', () => {
  return {
    ...OriginalReact,
    useContext: () => mockContextValue,
    useEffect: (fn: Function) => effectFns.push(fn),
    useState: (initial: any) => [initial, () => {}],
  };
});

const memoArray = new Array(20).fill(Symbol.for("react.memo_cache_sentinel"));
mock.module('react/compiler-runtime', () => ({
  c: (size: number) => memoArray,
}));

import { 
  PromptOverlayProvider, 
  usePromptOverlay, 
  usePromptOverlayDialog, 
  useSetPromptOverlay, 
  useSetPromptOverlayDialog 
} from '../promptOverlayContext.js';

describe('promptOverlayContext', () => {
  it('PromptOverlayProvider works', () => {
    memoArray.fill(Symbol.for("react.memo_cache_sentinel"));
    const element = PromptOverlayProvider({ children: 'test' }) as any;
    expect(element.type).toBeDefined();

    // hit cache
    const element2 = PromptOverlayProvider({ children: 'test' }) as any;
    expect(element2).toEqual(element);
  });

  it('usePromptOverlay works', () => {
    mockContextValue = { suggestions: [] };
    expect(usePromptOverlay()).toEqual({ suggestions: [] });
  });

  it('usePromptOverlayDialog works', () => {
    mockContextValue = 'dialog-node';
    expect(usePromptOverlayDialog()).toBe('dialog-node');
  });

  it('useSetPromptOverlay works', () => {
    effectFns = [];
    memoArray.fill(Symbol.for("react.memo_cache_sentinel"));
    
    // Testing missing context
    mockContextValue = null;
    useSetPromptOverlay({ suggestions: [], selectedSuggestion: 0 });
    expect(effectFns.length).toBe(1);
    expect(effectFns[0]()).toBeUndefined(); // no set function

    // Call again with same object to hit compiler cache for early return
    const emptyData = { suggestions: [], selectedSuggestion: 0 };
    useSetPromptOverlay(emptyData);
    useSetPromptOverlay(emptyData);

    // Testing present context
    effectFns = [];
    memoArray.fill(Symbol.for("react.memo_cache_sentinel"));
    const setMock = mock((val: any) => {});
    mockContextValue = setMock;

    const payload = { suggestions: [{ type: 'command', id: 'a', title: 'test', description: '' }], selectedSuggestion: 1 };
    
    // @ts-ignore
    useSetPromptOverlay(payload);
    const cleanup = effectFns[effectFns.length-1]();
    
    // @ts-ignore
    expect(setMock).toHaveBeenCalledWith(payload);

    // evaluate cleanup
    cleanup();
    expect(setMock).toHaveBeenCalledWith(null);

    // Call again to hit compiler array cache
    // @ts-ignore
    useSetPromptOverlay(payload);
  });

  it('useSetPromptOverlayDialog works', () => {
    effectFns = [];
    memoArray.fill(Symbol.for("react.memo_cache_sentinel"));

    // Testing missing context
    mockContextValue = null;
    useSetPromptOverlayDialog('my-node');
    expect(effectFns[0]()).toBeUndefined();

    // Testing present context
    effectFns = [];
    memoArray.fill(Symbol.for("react.memo_cache_sentinel"));
    const setMock = mock((val: any) => {});
    mockContextValue = setMock;

    useSetPromptOverlayDialog('my-new-node');
    const cleanup = effectFns[0]();
    
    expect(setMock).toHaveBeenCalledWith('my-new-node');

    // evaluate cleanup
    cleanup();
    expect(setMock).toHaveBeenCalledWith(null);

    // Call again to hit cache
    useSetPromptOverlayDialog('my-new-node');
  });
});
