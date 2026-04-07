import { describe, expect, it, mock } from 'bun:test';
import {
  activateProactive,
  deactivateProactive,
  isProactiveActive,
  isProactivePaused,
  pauseProactive,
  setContextBlocked,
  subscribeToProactiveChanges,
} from '../index';

describe('proactive/index', () => {
  describe('isProactiveActive', () => {
    it('should return false', () => {
      expect(isProactiveActive()).toBe(false);
    });
  });

  describe('isProactivePaused', () => {
    it('should return false', () => {
      expect(isProactivePaused()).toBe(false);
    });
  });

  describe('activateProactive', () => {
    it('should execute without error', () => {
      expect(() => activateProactive('testSource')).not.toThrow();
    });
  });

  describe('deactivateProactive', () => {
    it('should execute without error', () => {
      expect(() => deactivateProactive()).not.toThrow();
    });
  });

  describe('pauseProactive', () => {
    it('should execute without error', () => {
      expect(() => pauseProactive()).not.toThrow();
    });
  });

  describe('setContextBlocked', () => {
    it('should execute without error', () => {
      expect(() => setContextBlocked(true)).not.toThrow();
    });
  });

  describe('subscribeToProactiveChanges', () => {
    it('should execute without error and return a function', () => {
      const mockCallback = mock(() => undefined);
      const unsubscribe = subscribeToProactiveChanges(mockCallback);
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});
