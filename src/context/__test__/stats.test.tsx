/* eslint-disable @typescript-eslint/explicit-function-return-type, sonarjs/no-unused-vars */
import { describe, expect, it, mock, afterAll } from 'bun:test';

const OriginalReact = await import('react');

let mockContextValue: any = null;
let effectFns: any[] = [];

mock.module('react', () => {
  return {
    ...OriginalReact,
    useContext: () => mockContextValue,
    useCallback: (fn: any) => fn,
    useEffect: (fn: any) => effectFns.push(fn),
    useMemo: (fn: any) => fn(),
  };
});

const memoArray = new Array(20).fill(Symbol.for('react.memo_cache_sentinel'));
mock.module('react/compiler-runtime', () => ({
  c: (_size: number) => memoArray,
}));

let mockSaveCurrentProjectConfig: any;
mock.module('../../utils/config.js', () => ({
  saveCurrentProjectConfig: (fn: any) => {
    mockSaveCurrentProjectConfig = fn;
  },
}));

const processMock = {
  events: new Map<string, any>(),
  on: (event: string, fn: any) => processMock.events.set(event, fn),
  off: (event: string, _fn: any) => processMock.events.delete(event),
};
const originalProcess = global.process;
global.process = { ...originalProcess, on: processMock.on, off: processMock.off } as any;

import { createStatsStore, StatsProvider, useStats, useCounter, useGauge, useTimer, useSet } from '../stats.js';

describe('stats context', () => {
  afterAll(() => {
    global.process = originalProcess;
  });

  it('createStatsStore works', () => {
    const store = createStatsStore();

    // counter
    store.increment('c1');
    store.increment('c1', 2);
    expect(store.getAll().c1).toBe(3);

    // gauge
    store.set('g1', 10);
    expect(store.getAll().g1).toBe(10);

    // timer
    store.observe('t1', 5);
    store.observe('t1', 20);
    store.observe('t1', 10); // hit lower!==upper logic or percentile
    const all = store.getAll();
    expect(all.t1_count).toBe(3);
    expect(all.t1_min).toBe(5);
    expect(all.t1_max).toBe(20);
    expect(all.t1_avg).toBe(11.666666666666666);
    expect(all.t1_p50).toBe(10);

    // add to set
    store.add('s1', 'a');
    store.add('s1', 'b');
    store.add('s1', 'a'); // duplicate set item
    expect(store.getAll().s1).toBe(2);
  });

  it('createStatsStore reservoir sampling', () => {
    const store = createStatsStore();
    // 2000 means > RESERVOIR_SIZE (1024)
    for (let i = 0; i < 2000; i++) {
      store.observe('timer', i);
    }
    const all = store.getAll();
    expect(all.timer_count).toBe(2000);
    // count > 0 is true, hit reservoir truncation
  });

  it('StatsProvider works and mounts flush on exit', () => {
    memoArray.fill(Symbol.for('react.memo_cache_sentinel'));
    effectFns = [];
    processMock.events.clear();
    mockSaveCurrentProjectConfig = null;

    const _storeProp = null; // internal store
    const element = StatsProvider({ children: 'test' }) as any;
    expect(element.type).toBeDefined();

    // evaluate effect
    const cleanup = effectFns[0]();
    expect(processMock.events.has('exit')).toBe(true);

    // trigger flush with metrics
    const internalStore = element.props.value;
    internalStore.increment('some_metric');
    processMock.events.get('exit')?.();

    // biome-ignore lint/style/useNamingConvention: test
    expect(mockSaveCurrentProjectConfig({ prev: 1 })).toEqual({ prev: 1, lastSessionMetrics: { some_metric: 1 } });

    cleanup();
    expect(processMock.events.has('exit')).toBe(false);

    // Also trigger flush without metrics
    const elementEmpty = StatsProvider({ children: 'test' }) as any;
    mockSaveCurrentProjectConfig = null;
    processMock.events.get('exit')?.();
    expect(mockSaveCurrentProjectConfig).toBeNull(); // not called empty

    // hit cache
    const element2 = StatsProvider({ children: 'test' }) as any;
    expect(element2).toEqual(elementEmpty);
  });

  it('hooks throw outside provider', () => {
    mockContextValue = null;
    expect(() => useStats()).toThrow(/useStats must be used within a StatsProvider/);
  });

  it('hooks work inside provider', () => {
    const store = createStatsStore();
    mockContextValue = store;
    memoArray.fill(Symbol.for('react.memo_cache_sentinel'));

    useCounter('c1')();
    useCounter('c2')(2);
    useGauge('g1')(10);
    useTimer('t1')(5);
    useSet('s1')('a');

    const all = store.getAll();
    expect(all.c1).toBe(1);
    expect(all.c2).toBe(2);
    expect(all.g1).toBe(10);
    expect(all.t1_count).toBe(1);
    expect(all.s1).toBe(1);

    // Call hooks again to hit array cache branching
    useCounter('c1')();
    useCounter('c2')(1);
    useGauge('g1')(11);
    useTimer('t1')(6);
    useSet('s1')('b');
  });
});
