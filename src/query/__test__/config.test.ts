import { describe, it, expect, mock, afterEach } from 'bun:test';

mock.module('../../bootstrap/state.js', () => ({
  getSessionId: (): string => 'test-session-id',
}));
mock.module('../../services/analytics/growthbook.js', () => ({
  /* biome-ignore lint/style/useNamingConvention: imported function name */
  checkStatsigFeatureGate_CACHED_MAY_BE_STALE: (gate: string): boolean => gate === 'tengu_streaming_tool_execution2',
}));
mock.module('../../utils/envUtils.js', () => ({
  isEnvTruthy: (val: string | undefined): boolean => val === '1' || val?.toLowerCase() === 'true',
}));

import { buildQueryConfig } from '../config.js';

describe('buildQueryConfig', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should build query config correctly when truthy flags are set', () => {
    process.env = { ...originalEnv };
    // biome-ignore lint/style/useNamingConvention: env keys
    process.env.CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES = 'true';
    // biome-ignore lint/style/useNamingConvention: env keys
    process.env.USER_TYPE = 'ant';
    // biome-ignore lint/style/useNamingConvention: env keys
    process.env.CLAUDE_CODE_DISABLE_FAST_MODE = 'false';

    const config = buildQueryConfig();

    expect(config.sessionId).toBe('test-session-id' as any);
    expect(config.gates.streamingToolExecution).toBe(true);
    expect(config.gates.emitToolUseSummaries).toBe(true);
    expect(config.gates.isAnt).toBe(true);
    expect(config.gates.fastModeEnabled).toBe(true);
  });

  it('should handle falsy cases and other user types', () => {
    process.env = { ...originalEnv };
    // biome-ignore lint/style/useNamingConvention: env keys
    process.env.CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES = 'false';
    // biome-ignore lint/style/useNamingConvention: env keys
    process.env.USER_TYPE = 'employee';
    // biome-ignore lint/style/useNamingConvention: env keys
    process.env.CLAUDE_CODE_DISABLE_FAST_MODE = 'true';

    const config = buildQueryConfig();

    expect(config.sessionId).toBe('test-session-id' as any);
    expect(config.gates.streamingToolExecution).toBe(true);
    expect(config.gates.emitToolUseSummaries).toBe(false);
    expect(config.gates.isAnt).toBe(false);
    expect(config.gates.fastModeEnabled).toBe(false);
  });
});
