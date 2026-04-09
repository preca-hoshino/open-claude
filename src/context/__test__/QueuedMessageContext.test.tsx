import { describe, expect, it, mock } from 'bun:test';
import * as React from 'react';

mock.module('react/compiler-runtime', () => ({
  c: (size: number) => new Array(size).fill(Symbol('uninitialized')),
}));

import { QueuedMessageProvider, useQueuedMessage } from '../QueuedMessageContext.js';

describe('QueuedMessageContext', () => {
  it('useQueuedMessage should return correct context value inside provider', () => {
    // we can test QueuedMessageProvider by calling it directly, since the
    // React compiler output uses an internal _c(9) array which we mocked.
    const element = QueuedMessageProvider({
      isFirst: true,
      useBriefLayout: false,
      children: 'test'
    }) as any;

    expect(element.type).toBeDefined();
    // the value passed to the context provider
    expect(element.props.value).toEqual({
      isQueued: true,
      isFirst: true,
      paddingWidth: 4
    });
  });

  it('useQueuedMessage should handle useBriefLayout prop properly', () => {
    const element = QueuedMessageProvider({
      isFirst: false,
      useBriefLayout: true,
      children: 'test2'
    }) as any;

    expect(element.props.value).toEqual({
      isQueued: true,
      isFirst: false,
      paddingWidth: 0
    });
  });

});

