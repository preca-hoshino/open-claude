/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, expect, it, mock } from 'bun:test';

const OriginalReact = await import('react');

let mockContextValue: any = null;

let stateCache: any;
mock.module('react', () => {
  return {
    ...OriginalReact,
    useContext: () => mockContextValue,
    useSyncExternalStore: (_subscribe: any, getSnapshot: any) => getSnapshot(),
    useState: (init: any) => {
      if (stateCache === undefined) {
        stateCache = typeof init === 'function' ? init() : init;
      }
      return [stateCache, () => undefined];
    },
  };
});

const memoArray = new Array(20).fill(Symbol.for('react.memo_cache_sentinel'));
mock.module('react/compiler-runtime', () => ({
  c: (_size: number) => memoArray,
}));

import { createStore } from '../../state/store.js';
import { VoiceProvider, useVoiceState, useSetVoiceState, useGetVoiceState } from '../voice.js';

describe('voice context', () => {
  it('VoiceProvider works', () => {
    stateCache = undefined;
    memoArray.fill(Symbol.for('react.memo_cache_sentinel'));
    const element = VoiceProvider({ children: 'test' }) as any;
    expect(element.type).toBeDefined();

    const element2 = VoiceProvider({ children: 'test' }) as any;
    expect(element2).toEqual(element);
  });

  it('hooks throw outside provider', () => {
    mockContextValue = null;
    expect(() => useVoiceState((s: any) => s)).toThrow(/useVoiceState must be used within a VoiceProvider/);
    expect(() => useSetVoiceState()).toThrow(/useVoiceState must be used within a VoiceProvider/);
    expect(() => useGetVoiceState()).toThrow(/useVoiceState must be used within a VoiceProvider/);
  });

  it('hooks work inside provider', () => {
    const store = createStore({
      voiceState: 'idle',
      voiceError: null,
      voiceInterimTranscript: '',
      voiceAudioLevels: [],
      voiceWarmingUp: false,
    });

    mockContextValue = store;
    memoArray.fill(Symbol.for('react.memo_cache_sentinel'));

    // useSetVoiceState
    const set = useSetVoiceState();
    set((prev: any) => ({ ...prev, voiceState: 'recording' }));

    // useGetVoiceState
    const get = useGetVoiceState();
    expect(get().voiceState).toBe('recording');

    // useVoiceState
    const selector = (s: any) => s.voiceState;
    const result = useVoiceState(selector);
    expect(result).toBe('recording');

    // Call useVoiceState again with SAME selector to hit compiler array cache branch
    const result2 = useVoiceState(selector);
    expect(result2).toBe('recording');
  });
});
