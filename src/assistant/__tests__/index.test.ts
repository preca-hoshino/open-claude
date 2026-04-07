import { describe, expect, it } from 'bun:test';
import {
  getAssistantActivationPath,
  getAssistantSystemPromptAddendum,
  initializeAssistantTeam,
  isAssistantForced,
  isAssistantMode,
  markAssistantForced,
} from '../index';

describe('index', () => {
  describe('isAssistantMode', () => {
    it('should return false', () => {
      expect(isAssistantMode()).toBeFalsy();
    });
  });

  describe('isAssistantForced', () => {
    it('should return false', () => {
      expect(isAssistantForced()).toBeFalsy();
    });
  });

  describe('markAssistantForced', () => {
    it('should not throw', () => {
      expect(() => markAssistantForced()).not.toThrow();
    });
  });

  describe('initializeAssistantTeam', () => {
    it('should return empty object', async () => {
      const result = await initializeAssistantTeam();
      expect(result).toEqual({});
    });
  });

  describe('getAssistantSystemPromptAddendum', () => {
    it('should return empty string', () => {
      expect(getAssistantSystemPromptAddendum()).toBe('');
    });
  });

  describe('getAssistantActivationPath', () => {
    it('should return undefined', () => {
      expect(getAssistantActivationPath()).toBeUndefined();
    });
  });
});
