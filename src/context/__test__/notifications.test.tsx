/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';

const OriginalReact = await import('react');

let effectFns: any[] = [];

mock.module('react', () => {
  return {
    ...OriginalReact,
    useCallback: (fn: any) => fn,
    useEffect: (fn: any) => effectFns.push(fn),
  };
});

let currentState: any = { notifications: { current: null, queue: [] } };

mock.module('../../state/AppState.js', () => ({
  useAppStateStore: () => ({ getState: () => currentState }),
  useSetAppState: () => (updater: any) => {
    if (typeof updater === 'function') {
      currentState = updater(currentState);
    } else {
      currentState = updater;
    }
  },
}));

const setTimeoutFns: { id: number; fn: any; args: any[]; cancelled: boolean }[] = [];
const _originalSetTimeout = global.setTimeout;
const _originalClearTimeout = global.clearTimeout;

(global as any).setTimeout = (fn: any, _duration: any, ...args: any[]) => {
  const id = setTimeoutFns.length + 1;
  setTimeoutFns.push({ id, fn, args, cancelled: false });
  return id as any;
};
(global as any).clearTimeout = (id: any) => {
  const obj = setTimeoutFns.find((o: any) => o.id === id);
  if (obj !== undefined) {
    obj.cancelled = true;
  }
};

function runTimeouts() {
  const fns = [...setTimeoutFns];
  setTimeoutFns.length = 0;
  for (const { fn, args, cancelled } of fns) {
    if (!cancelled) {
      fn(...args);
    }
  }
}

import { useNotifications, getNext } from '../notifications.js';

describe('notifications context', () => {
  beforeEach(() => {
    currentState = { notifications: { current: null, queue: [] } };
    effectFns = [];
    setTimeoutFns.length = 0;
  });

  afterEach(() => {
    setTimeoutFns.length = 0;
  });

  it('getNext works', () => {
    const q: any[] = [{ priority: 'low' }, { priority: 'immediate' }, { priority: 'medium' }];
    expect(getNext(q)?.priority).toBe('immediate');
    expect(getNext([])).toBeUndefined();
  });

  it('useNotifications mount processQueue', () => {
    currentState.notifications.queue.push({ key: 'init', priority: 'low' });
    useNotifications();
    expect(effectFns.length).toBe(1);

    // Call effect manually to simulate mount
    effectFns[0]();

    // After mount processQueue, current is set
    expect(currentState.notifications.current.key).toBe('init');
    expect(currentState.notifications.queue.length).toBe(0);
  });

  it('addNotification standard queue', () => {
    const { addNotification } = useNotifications();

    addNotification({ key: 'n1', priority: 'low', text: '1' } as any);
    expect(currentState.notifications.current.key).toBe('n1');

    addNotification({ key: 'n2', priority: 'medium', text: '2' } as any);
    expect(currentState.notifications.queue[0].key).toBe('n2');

    // duplicate keys do not get added if already in queue or current
    addNotification({ key: 'n2', priority: 'medium', text: 'dup' } as any);
    expect(currentState.notifications.queue.length).toBe(1);
  });

  it('addNotification immediate', () => {
    const { addNotification } = useNotifications();

    addNotification({ key: 'n1', priority: 'low' } as any);
    expect(currentState.notifications.current.key).toBe('n1');

    // Immediate should replace current and requeue the replaced one
    addNotification({ key: 'imm', priority: 'immediate' } as any);
    expect(currentState.notifications.current.key).toBe('imm');
    expect(currentState.notifications.queue[0].key).toBe('n1');

    runTimeouts();
    // After timeout, imm expires and n1 gets back to current
    expect(currentState.notifications.current?.key).toBe('n1');
  });

  it('removeNotification works', () => {
    const { addNotification, removeNotification } = useNotifications();
    addNotification({ key: 'n1', priority: 'low' } as any);
    addNotification({ key: 'n2', priority: 'low' } as any);

    // Remove from queue
    removeNotification('n2');
    expect(currentState.notifications.queue.length).toBe(0);

    // Remove current
    removeNotification('n1');
    expect(currentState.notifications.current).toBeNull();
  });

  it('addNotification fold works for queue', () => {
    const { addNotification } = useNotifications();
    addNotification({ key: 'n1', priority: 'low' } as any);
    addNotification({
      key: 'foldable',
      priority: 'low',
      text: 'A',
      fold: (acc: any, incoming: any) => ({ ...acc, text: acc.text + incoming.text }),
    } as any);

    expect(currentState.notifications.queue[0].text).toBe('A');

    // add again to trigger fold in queue
    addNotification({
      key: 'foldable',
      priority: 'low',
      text: 'B',
      fold: (acc: any, incoming: any) => ({ ...acc, text: acc.text + incoming.text }),
    } as any);

    expect(currentState.notifications.queue[0].text).toBe('AB');
  });

  it('addNotification fold works for current', () => {
    const { addNotification } = useNotifications();
    addNotification({
      key: 'foldable',
      priority: 'low',
      text: 'A',
      fold: (acc: any, incoming: any) => ({ ...acc, text: acc.text + incoming.text }),
    } as any);

    expect(currentState.notifications.current.text).toBe('A');

    // add again to trigger fold in current
    addNotification({
      key: 'foldable',
      priority: 'low',
      text: 'B',
      fold: (acc: any, incoming: any) => ({ ...acc, text: acc.text + incoming.text }),
    } as any);

    expect(currentState.notifications.current.text).toBe('AB');
  });

  it('addNotification sets timeout and clears it', () => {
    const { addNotification } = useNotifications();
    addNotification({ key: 'n1', priority: 'low', timeoutMs: 1000 } as any);

    // Simulate timeout manually
    runTimeouts();
    expect(currentState.notifications.current).toBeNull();
  });

  it('removeNotification ignores missing keys', () => {
    const { addNotification, removeNotification } = useNotifications();
    addNotification({ key: 'n1', priority: 'low' } as any);
    removeNotification('n-missing');
    expect(currentState.notifications.current.key).toBe('n1');
  });

  it('addNotification invalidates works', () => {
    const { addNotification } = useNotifications();

    // Add current
    addNotification({ key: 'n1', priority: 'low' } as any);
    // Add to queue
    addNotification({ key: 'n2', priority: 'medium' } as any);

    // Add a new notification that invalidates n1 and n2
    addNotification({
      key: 'n3',
      priority: 'high',
      invalidates: ['n1', 'n2'],
    } as any);

    // Current should be null (since invalidatesCurrent is true), queue will have n3
    // But since n1 was invalidated, processQueue kicks in right after and sets n3 as current
    expect(currentState.notifications.current.key).toBe('n3');
    // n2 was in queue and should be removed
    expect(currentState.notifications.queue.find((n: any) => n.key === 'n2')).toBeUndefined();
  });
});
