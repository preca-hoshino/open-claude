import { describe, it, expect, mock, afterEach } from 'bun:test'

mock.module('../../bootstrap/state.js', () => ({
  getSessionId: () => 'test-session-id',
}))
mock.module('../../services/analytics/growthbook.js', () => ({
  checkStatsigFeatureGate_CACHED_MAY_BE_STALE: (gate: string) => gate === 'tengu_streaming_tool_execution2',
}))
mock.module('../../utils/envUtils.js', () => ({
  isEnvTruthy: (val: string | undefined) => val === '1' || val?.toLowerCase() === 'true',
}))

import { buildQueryConfig } from '../config.js'

describe('buildQueryConfig', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  it('should build query config correctly when truthy flags are set', () => {
    process.env = {
      ...originalEnv,
      CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES: 'true',
      USER_TYPE: 'ant',
      CLAUDE_CODE_DISABLE_FAST_MODE: 'false',
    }

    const config = buildQueryConfig()

    expect(config.sessionId).toBe('test-session-id')
    expect(config.gates.streamingToolExecution).toBe(true)
    expect(config.gates.emitToolUseSummaries).toBe(true)
    expect(config.gates.isAnt).toBe(true)
    expect(config.gates.fastModeEnabled).toBe(true)
  })

  it('should handle falsy cases and other user types', () => {
    process.env = {
      ...originalEnv,
      CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES: 'false',
      USER_TYPE: 'employee',
      CLAUDE_CODE_DISABLE_FAST_MODE: 'true',
    }

    const config = buildQueryConfig()

    expect(config.sessionId).toBe('test-session-id')
    expect(config.gates.streamingToolExecution).toBe(true)
    expect(config.gates.emitToolUseSummaries).toBe(false)
    expect(config.gates.isAnt).toBe(false)
    expect(config.gates.fastModeEnabled).toBe(false)
  })
})
