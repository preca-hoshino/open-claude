import { describe, expect, it } from 'bun:test';
import { HookCommandSchema, HookMatcherSchema, HooksSchema } from '../hooks.js';

describe('HookCommandSchema', () => {
  describe('BashCommandHookSchema (type: command)', () => {
    it('should parse valid bash hook', () => {
      const payload = {
        type: 'command',
        command: 'echo $ARGUMENTS',
        if: 'Bash(git *)',
        shell: 'bash',
        timeout: 10,
        statusMessage: 'Running bash hook...',
        once: true,
        async: false,
        asyncRewake: false,
      };
      const result = HookCommandSchema().safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(payload as any);
      }
    });

    it('should reject invalid combinations (missing command)', () => {
      const payload = { type: 'command' };
      const result = HookCommandSchema().safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('PromptHookSchema (type: prompt)', () => {
    it('should parse valid prompt hook', () => {
      const payload = {
        type: 'prompt',
        prompt: 'Check $ARGUMENTS',
        if: 'Bash(*)',
        timeout: 20,
        model: 'claude-sonnet-4-6',
        statusMessage: 'Prompting...',
        once: true,
      };
      const result = HookCommandSchema().safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(payload as any);
      }
    });

    it('should reject missing prompt', () => {
      const payload = { type: 'prompt' };
      const result = HookCommandSchema().safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('HttpHookSchema (type: http)', () => {
    it('should parse valid http hook', () => {
      const payload = {
        type: 'http',
        url: 'https://example.com/webhook',
        if: 'Read(*)',
        timeout: 30,
        // biome-ignore lint/style/useNamingConvention: matches HTTP header syntax
        headers: { Authorization: 'Bearer $TOKEN' },
        allowedEnvVars: ['TOKEN'],
        statusMessage: 'Sending HTTP hook...',
        once: false,
      };
      const result = HookCommandSchema().safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(payload as any);
      }
    });

    it('should reject invalid URL', () => {
      const payload = { type: 'http', url: 'not-a-url' };
      const result = HookCommandSchema().safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('AgentHookSchema (type: agent)', () => {
    it('should parse valid agent hook', () => {
      const payload = {
        type: 'agent',
        prompt: 'Verify code',
        if: '*',
        timeout: 60,
        model: 'claude-sonnet-4-6',
        statusMessage: 'Verifying...',
        once: true,
      };
      const result = HookCommandSchema().safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(payload as any);
      }
    });

    it('should reject missing agent prompt', () => {
      const payload = { type: 'agent' };
      const result = HookCommandSchema().safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});

describe('HookMatcherSchema', () => {
  it('should parse valid matcher configuration', () => {
    const payload = {
      matcher: 'Write',
      hooks: [
        { type: 'command', command: 'echo "hi"' },
        { type: 'prompt', prompt: 'hi' },
      ],
    };
    const result = HookMatcherSchema().safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject if hooks array is invalid', () => {
    const payload = {
      matcher: 'Write',
      hooks: [{ type: 'unknown_type' }],
    };
    const result = HookMatcherSchema().safeParse(payload);
    expect(result.success).toBe(false);
  });
});

describe('HooksSchema', () => {
  it('should parse dictionary of hooks mapped to event names', () => {
    const payload = {
      // biome-ignore lint/style/useNamingConvention: matches Event names
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: [{ type: 'command', command: 'echo pre' }],
        },
      ],
      // biome-ignore lint/style/useNamingConvention: matches Event names
      PostToolUse: [
        {
          hooks: [{ type: 'command', command: 'echo post' }],
        },
      ],
    };
    const result = HooksSchema().safeParse(payload);
    if (!result.success) {
      console.error(result.error);
    }
    expect(result.success).toBe(true);
  });

  it('should reject invalid event names', () => {
    const payload = {
      unknownEvent: [
        {
          hooks: [{ type: 'command', command: 'echo unknown' }],
        },
      ],
    };
    const result = HooksSchema().safeParse(payload);
    expect(result.success).toBe(false);
  });
});
