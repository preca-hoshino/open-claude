/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, expect, it, mock } from 'bun:test';

// Must import original React up here because mock.module happens first
const OriginalReact = await import('react');

let mockContextValue: any = undefined;

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

import { QueuedMessageProvider, useQueuedMessage } from '../QueuedMessageContext.js';

describe('QueuedMessageContext', () => {
  it('useQueuedMessage should return correct context value inside provider', () => {
    // we can test QueuedMessageProvider by calling it directly, since the
    // React compiler output uses an internal _c(9) array which we mocked.
    const element = QueuedMessageProvider({
      isFirst: true,
      useBriefLayout: false,
      children: 'test',
    }) as any;

    expect(element.type).toBeDefined();
    // the value passed to the context provider
    expect(element.props.value).toEqual({
      isQueued: true,
      isFirst: true,
      paddingWidth: 4,
    });
  });

  it('useQueuedMessage should handle useBriefLayout prop properly', () => {
    const element = QueuedMessageProvider({
      isFirst: false,
      useBriefLayout: true,
      children: 'test2',
    }) as any;

    expect(element.props.value).toEqual({
      isQueued: true,
      isFirst: false,
      paddingWidth: 0,
    });
  });

  it('useQueuedMessage gets context correctly', () => {
    mockContextValue = undefined;
    expect(useQueuedMessage()).toBeUndefined();

    const val = { isQueued: true, isFirst: true, paddingWidth: 4 };
    mockContextValue = val;
    expect(useQueuedMessage()).toBe(val);
  });
});
