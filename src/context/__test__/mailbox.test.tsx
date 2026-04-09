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

import { MailboxProvider, useMailbox } from '../mailbox.js';
import { Mailbox } from '../../utils/mailbox.js';

describe('mailbox', () => {
  it('MailboxProvider provides context and hits cache', () => {
    const children = 'test';
    const element1 = MailboxProvider({ children }) as any;
    expect(element1.type).toBeDefined();

    // Call again to hit compiler cache
    const element2 = MailboxProvider({ children }) as any;
    expect(element2).toEqual(element1);

    expect(element1.props.value).toBeInstanceOf(Mailbox);
  });

  it('useMailbox calls useContext and throws when outside component', () => {
    mockContextValue = undefined;
    expect(() => useMailbox()).toThrow(/useMailbox must be used within a MailboxProvider/);

    // hit the valid path
    mockContextValue = new Mailbox();
    expect(useMailbox()).toBeDefined();
  });
});
