import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'

const logEventMock = mock()

const extractMemoriesMock = mock(() => Promise.resolve())
mock.module('../../services/extractMemories/extractMemories.js', () => ({
  executeExtractMemories: extractMemoriesMock,
}))

const classifyAndWriteStateMock = mock(() => Promise.resolve())
mock.module('../../jobs/classifier.js', () => ({
  classifyAndWriteState: classifyAndWriteStateMock,
}))

const executeAutoDreamMock = mock(() => Promise.resolve())
mock.module('../../services/autoDream/autoDream.js', () => ({
  executeAutoDream: executeAutoDreamMock,
}))

const executePromptSuggestionMock = mock(() => Promise.resolve())
mock.module('../../services/PromptSuggestion/promptSuggestion.js', () => ({
  executePromptSuggestion: executePromptSuggestionMock,
}))

const cleanupComputerUseAfterTurnMock = mock(() => Promise.resolve())
mock.module('../../utils/computerUse/cleanup.js', () => ({
  cleanupComputerUseAfterTurn: cleanupComputerUseAfterTurnMock,
}))

mock.module('../../services/analytics/index.js', () => ({
  logEvent: logEventMock,
}))

const createCacheSafeParamsMock = mock(() => ({}))
const saveCacheSafeParamsMock = mock()
mock.module('../../utils/forkedAgent.js', () => ({
  createCacheSafeParams: createCacheSafeParamsMock,
  saveCacheSafeParams: saveCacheSafeParamsMock,
}))

mock.module('../../utils/debug.js', () => ({
  logForDebugging: mock(),
}))

const getShortcutDisplayMock = mock(() => 'ctrl+o')
mock.module('../../keybindings/shortcutFormat.js', () => ({
  getShortcutDisplay: getShortcutDisplayMock,
}))

const isExtractModeActiveMock = mock(() => true)
mock.module('../../memdir/paths.js', () => ({
  isExtractModeActive: isExtractModeActiveMock,
}))

const isBareModeMock = mock(() => false)
const isEnvDefinedFalsyMock = mock(() => false)
mock.module('../../utils/envUtils.js', () => ({
  isBareMode: isBareModeMock,
  isEnvDefinedFalsy: isEnvDefinedFalsyMock,
}))

const executeStopHooksMock = mock(async function* () {})
const executeTaskCompletedHooksMock = mock(async function* () {})
const executeTeammateIdleHooksMock = mock(async function* () {})
mock.module('../../utils/hooks.js', () => ({
  executeStopHooks: executeStopHooksMock,
  executeTaskCompletedHooks: executeTaskCompletedHooksMock,
  executeTeammateIdleHooks: executeTeammateIdleHooksMock,
  getStopHookMessage: () => 'stop hook msg',
  getTaskCompletedHookMessage: () => 'task hook msg',
  getTeammateIdleHookMessage: () => 'idle hook msg',
}))

mock.module('../../utils/hooks/postSamplingHooks.js', () => ({
  // types only
}))

mock.module('../../utils/messages.js', () => ({
  createStopHookSummaryMessage: mock(() => ({ type: 'message', content: 'summary' })),
  createSystemMessage: mock((msg) => ({ type: 'message', content: msg })),
  createUserInterruptionMessage: mock(() => ({ type: 'message', content: 'interrupted' })),
  createUserMessage: mock((opts) => ({ type: 'user', ...opts })),
}))

mock.module('../../utils/attachments.js', () => ({
  createAttachmentMessage: mock((opts) => ({ type: 'attachment', attachment: opts })),
}))

mock.module('../../utils/errors.js', () => ({
  errorMessage: (err: any) => err.message || String(err),
}))

const getTaskListIdMock = mock(() => 'task-list-id')
const listTasksMock = mock(() => [])
mock.module('../../utils/tasks.js', () => ({
  getTaskListId: getTaskListIdMock,
  listTasks: listTasksMock,
}))

const isTeammateMock = mock(() => false)
const getAgentNameMock = mock(() => 'agent')
const getTeamNameMock = mock(() => 'team')
mock.module('../../utils/teammate.js', () => ({
  isTeammate: isTeammateMock,
  getAgentName: getAgentNameMock,
  getTeamName: getTeamNameMock,
}))

import { handleStopHooks } from '../stopHooks.js'
import { feature } from 'bun:bundle'

function createContext(overrides: any = {}) {
  const ac = new AbortController()
  return {
    toolUseContext: {
      abortController: ac,
      getAppState: () => ({ toolPermissionContext: { mode: 'auto' } }),
      agentId: undefined,
      agentType: 'main',
      queryTracking: { chainId: 'test-chain', depth: 1 },
      appendSystemMessage: mock(),
      addNotification: mock(),
      ...overrides.toolUseContext,
    },
    systemPrompt: { text: 'sys' },
    userContext: {},
    systemContext: {},
    messages: overrides.messages || [],
    assistantMessages: overrides.assistantMessages || [],
    querySource: overrides.querySource || 'repl_main_thread',
  }
}

async function consumeGenerator(gen: any) {
  const results = []
  let r = await gen.next()
  while (!r.done) {
    results.push(r.value)
    r = await gen.next()
  }
  return { results, final: r.value }
}

describe('stopHooks', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    mock.restore()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('runs empty hooks generators and skips background tasks if bare mode', async () => {
    isBareModeMock.mockReturnValue(true)
    const ctx = createContext()
    const gen = handleStopHooks(
      ctx.messages, ctx.assistantMessages, ctx.systemPrompt, ctx.userContext, ctx.systemContext, ctx.toolUseContext as any, ctx.querySource
    )
    const out = await consumeGenerator(gen)
    expect(out.results.length).toBe(0)
    expect(saveCacheSafeParamsMock).toHaveBeenCalled()
    expect(executeAutoDreamMock).not.toHaveBeenCalled()
  })

  it('runs background tasks if not bare mode', async () => {
    isBareModeMock.mockReturnValue(false)
    const ctx = createContext()
    const gen = handleStopHooks(
      ctx.messages, ctx.assistantMessages, ctx.systemPrompt, ctx.userContext, ctx.systemContext, ctx.toolUseContext as any, ctx.querySource
    )
    await consumeGenerator(gen)
    expect(executePromptSuggestionMock).toHaveBeenCalled()
    expect(executeAutoDreamMock).toHaveBeenCalled()
  })

  it('handles job classifier and throws gracefully', async () => {
    process.env.CLAUDE_JOB_DIR = '/test/dir'
    classifyAndWriteStateMock.mockRejectedValue(new Error('classifier err'))
    const ctx = createContext({
      assistantMessages: [{ type: 'assistant', text: 'hi' }]
    })
    const gen = handleStopHooks(
      ctx.messages, ctx.assistantMessages, ctx.systemPrompt, ctx.userContext, ctx.systemContext, ctx.toolUseContext as any, ctx.querySource
    )
    await consumeGenerator(gen)
  })

  it('generates progress, blocking errors, and summary from executeStopHooks', async () => {
    executeStopHooksMock.mockImplementation(async function* () {
      yield { message: { type: 'progress', toolUseID: 'tu-123', data: { command: 'test-cmd', promptText: 'cmd' } } }
      yield { message: { type: 'attachment', attachment: { hookEvent: 'Stop', type: 'hook_non_blocking_error', stderr: 'error 1' } } }
      yield { message: { type: 'attachment', attachment: { hookEvent: 'Stop', type: 'hook_error_during_execution', content: 'error 2' } } }
      yield { message: { type: 'attachment', attachment: { hookEvent: 'SubagentStop', type: 'hook_success', stdout: 'win' } } }
      yield { message: { type: 'attachment', attachment: { hookEvent: 'Stop', command: 'test-cmd', durationMs: 15 } } }
      yield { blockingError: { blockingError: 'block_err' } }
    })
    const ctx = createContext()
    const gen = handleStopHooks(
      ctx.messages, ctx.assistantMessages, ctx.systemPrompt, ctx.userContext, ctx.systemContext, ctx.toolUseContext as any, ctx.querySource
    )
    const out = await consumeGenerator(gen)
    expect(out.results.length).toBeGreaterThan(0)
    expect(out.final).toBeObject()
    expect(out.final.blockingErrors.length).toBe(1)
  })

  it('handles preventContinuation from executeStopHooks', async () => {
    executeStopHooksMock.mockImplementation(async function* () {
      yield { message: { type: 'progress', toolUseID: 'tu-123', data: {} } }
      yield { preventContinuation: true, stopReason: 'stop-reason' }
    })
    const ctx = createContext()
    const gen = handleStopHooks(
      ctx.messages, ctx.assistantMessages, ctx.systemPrompt, ctx.userContext, ctx.systemContext, ctx.toolUseContext as any, ctx.querySource
    )
    const out = await consumeGenerator(gen)
    expect(out.final).toBeObject()
    expect(out.final.preventContinuation).toBe(true)
  })

  it('handles aborted during executeStopHooks', async () => {
    const ctx = createContext()
    executeStopHooksMock.mockImplementation(async function* () {
      ctx.toolUseContext.abortController.abort()
      yield { message: null } // dummy to trigger abort check inside the loop
    })
    const gen = handleStopHooks(
      ctx.messages, ctx.assistantMessages, ctx.systemPrompt, ctx.userContext, ctx.systemContext, ctx.toolUseContext as any, ctx.querySource
    )
    const out = await consumeGenerator(gen)
    expect(out.final).toBeObject()
    expect(out.final.preventContinuation).toBe(true)
    expect(logEventMock).toHaveBeenCalledWith('tengu_pre_stop_hooks_cancelled', expect.anything())
  })

  it('runs teammate hooks and completes tasks', async () => {
    isTeammateMock.mockReturnValue(true)
    listTasksMock.mockReturnValue([{id: 't-123', status: 'in_progress', owner: 'agent', subject: 'sub', description: 'desc'}])
    
    executeTaskCompletedHooksMock.mockImplementation(async function* () {
      yield { message: { type: 'progress', toolUseID: 'tu-task', data: {} } }
      yield { blockingError: { error: 'blocktask' } }
      yield { preventContinuation: true }
    })
    
    executeTeammateIdleHooksMock.mockImplementation(async function* () {
      yield { message: { type: 'progress', toolUseID: 'tu-idle', data: {} } }
      yield { blockingError: { error: 'blockidle' } }
      yield { preventContinuation: true }
    })

    const ctx = createContext()
    const gen = handleStopHooks(
      ctx.messages, ctx.assistantMessages, ctx.systemPrompt, ctx.userContext, ctx.systemContext, ctx.toolUseContext as any, ctx.querySource
    )
    const out = await consumeGenerator(gen)
    expect(out.final.preventContinuation).toBe(true)
  })

  it('yields error from catch block when error thrown', async () => {
    executeStopHooksMock.mockImplementation(() => { throw new Error('critical failure') })
    const ctx = createContext()
    const gen = handleStopHooks(
      ctx.messages, ctx.assistantMessages, ctx.systemPrompt, ctx.userContext, ctx.systemContext, ctx.toolUseContext as any, ctx.querySource
    )
    const out = await consumeGenerator(gen)
    
    expect(logEventMock).toHaveBeenCalledWith('tengu_stop_hook_error', expect.anything())
    expect(out.results[0].content).toContain('critical failure')
  })
})
