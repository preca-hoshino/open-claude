import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { ASYNC_AGENT_ALLOWED_TOOLS } from '../../constants/tools.js';
import * as growthbook from '../../services/analytics/growthbook.js';
import * as analytics from '../../services/analytics/index.js';
import { AGENT_TOOL_NAME } from '../../tools/AgentTool/constants.js';
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js';
import { FILE_EDIT_TOOL_NAME } from '../../tools/FileEditTool/constants.js';
import { FILE_READ_TOOL_NAME } from '../../tools/FileReadTool/prompt.js';
import { SEND_MESSAGE_TOOL_NAME } from '../../tools/SendMessageTool/constants.js';
import { SYNTHETIC_OUTPUT_TOOL_NAME } from '../../tools/SyntheticOutputTool/SyntheticOutputTool.js';
import { TASK_STOP_TOOL_NAME } from '../../tools/TaskStopTool/prompt.js';
import { TEAM_CREATE_TOOL_NAME } from '../../tools/TeamCreateTool/constants.js';
import { TEAM_DELETE_TOOL_NAME } from '../../tools/TeamDeleteTool/constants.js';
import * as envUtils from '../../utils/envUtils.js';
import * as coordinatorMode from '../coordinatorMode.js';

describe('coordinatorMode', () => {
  let isCoordinatorModeSpy: any;
  let isEnvTruthySpy: any;
  let checkStatsigFeatureGateSpy: any;
  let logEventSpy: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    // We cannot easily test the `feature('COORDINATOR_MODE')` path if it compile-time evaluates
    // to false. However, for functions that depend on it, we can spy on isCoordinatorMode.
    isCoordinatorModeSpy = spyOn(coordinatorMode, 'isCoordinatorMode');
    isEnvTruthySpy = spyOn(envUtils, 'isEnvTruthy').mockReturnValue(false);
    checkStatsigFeatureGateSpy = spyOn(growthbook, 'checkStatsigFeatureGate_CACHED_MAY_BE_STALE').mockReturnValue(
      false
    );
    logEventSpy = spyOn(analytics, 'logEvent').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    mock.restore();
  });

  describe('isCoordinatorMode', () => {
    it('returns false by default in tests (macro branch)', () => {
      isCoordinatorModeSpy.mockRestore();
      // Tests do not have the macro enabled by default, or it might be enabled but env var is false.
      process.env.CLAUDE_CODE_COORDINATOR_MODE = undefined;
      expect(coordinatorMode.isCoordinatorMode()).toBe(false);
    });
  });

  describe('matchSessionMode', () => {
    it('returns undefined if sessionMode is undefined', () => {
      expect(coordinatorMode.matchSessionMode(undefined)).toBeUndefined();
    });

    it('returns undefined if current isCoordinatorMode matches sessionMode (both normal)', () => {
      isCoordinatorModeSpy.mockReturnValue(false);
      expect(coordinatorMode.matchSessionMode('normal')).toBeUndefined();
    });

    it('returns undefined if current isCoordinatorMode matches sessionMode (both coordinator)', () => {
      isCoordinatorModeSpy.mockReturnValue(true);
      expect(coordinatorMode.matchSessionMode('coordinator')).toBeUndefined();
    });

    it('flips env var to true if session is coordinator but current is not', () => {
      isCoordinatorModeSpy.mockReturnValue(false);
      const res = coordinatorMode.matchSessionMode('coordinator');
      expect(process.env.CLAUDE_CODE_COORDINATOR_MODE).toBe('1');
      expect(logEventSpy).toHaveBeenCalledWith('tengu_coordinator_mode_switched', { to: 'coordinator' });
      expect(res).toBe('Entered coordinator mode to match resumed session.');
    });

    it('flips env var to undefined if session is normal but current is coordinator', () => {
      process.env.CLAUDE_CODE_COORDINATOR_MODE = '1';
      isCoordinatorModeSpy.mockReturnValue(true);
      const res = coordinatorMode.matchSessionMode('normal');
      expect(process.env.CLAUDE_CODE_COORDINATOR_MODE).toBeUndefined();
      expect(logEventSpy).toHaveBeenCalledWith('tengu_coordinator_mode_switched', { to: 'normal' });
      expect(res).toBe('Exited coordinator mode to match resumed session.');
    });
  });

  describe('getCoordinatorUserContext', () => {
    it('returns empty object if not in coordinator mode', () => {
      isCoordinatorModeSpy.mockReturnValue(false);
      expect(coordinatorMode.getCoordinatorUserContext([])).toEqual({});
    });

    it('returns context with basic worker tools when CLAUDE_CODE_SIMPLE is truthy', () => {
      isCoordinatorModeSpy.mockReturnValue(true);
      isEnvTruthySpy.mockImplementation((val: string) => val === 'true');
      process.env.CLAUDE_CODE_SIMPLE = 'true';

      const res = coordinatorMode.getCoordinatorUserContext([]);
      const expectedTools = [BASH_TOOL_NAME, FILE_READ_TOOL_NAME, FILE_EDIT_TOOL_NAME]
        .sort((a, b) => a.localeCompare(b))
        .join(', ');

      expect(res.workerToolsContext).toContain(`access to these tools: ${expectedTools}`);
    });

    it('returns context with async agent tools when CLAUDE_CODE_SIMPLE is falsy', () => {
      isCoordinatorModeSpy.mockReturnValue(true);
      isEnvTruthySpy.mockReturnValue(false);

      const InternalWorkerTools = new Set([
        TEAM_CREATE_TOOL_NAME,
        TEAM_DELETE_TOOL_NAME,
        SEND_MESSAGE_TOOL_NAME,
        SYNTHETIC_OUTPUT_TOOL_NAME,
      ]);
      const expectedTools = Array.from(ASYNC_AGENT_ALLOWED_TOOLS)
        .filter((name) => !InternalWorkerTools.has(name as any))
        .sort((a, b) => a.localeCompare(b))
        .join(', ');

      const res = coordinatorMode.getCoordinatorUserContext([]);
      expect(res.workerToolsContext).toContain(`access to these tools: ${expectedTools}`);
    });

    it('adds MCP clients context when present', () => {
      isCoordinatorModeSpy.mockReturnValue(true);
      const res = coordinatorMode.getCoordinatorUserContext([{ name: 'server1' }, { name: 'server2' }]);
      expect(res.workerToolsContext).toContain('access to MCP tools from connected MCP servers: server1, server2');
    });

    it('adds scratchpad context when scratchpadDir is provided and gate is enabled', () => {
      isCoordinatorModeSpy.mockReturnValue(true);
      checkStatsigFeatureGateSpy.mockReturnValue(true);

      const res = coordinatorMode.getCoordinatorUserContext([], '/foo/bar/scratch');
      expect(res.workerToolsContext).toContain('Scratchpad directory: /foo/bar/scratch');
    });

    it('does not add scratchpad context when gate is disabled', () => {
      isCoordinatorModeSpy.mockReturnValue(true);
      checkStatsigFeatureGateSpy.mockReturnValue(false);

      const res = coordinatorMode.getCoordinatorUserContext([], '/foo/bar/scratch');
      expect(res.workerToolsContext).not.toContain('Scratchpad directory: /foo/bar/scratch');
    });
  });

  describe('getCoordinatorSystemPrompt', () => {
    it('returns simple capabilities when CLAUDE_CODE_SIMPLE is truthy', () => {
      isEnvTruthySpy.mockImplementation((val: string) => val === 'true');
      process.env.CLAUDE_CODE_SIMPLE = 'true';

      const prompt = coordinatorMode.getCoordinatorSystemPrompt();
      expect(prompt).toContain('Workers have access to Bash, Read, and Edit tools');
    });

    it('returns standard capabilities when CLAUDE_CODE_SIMPLE is falsy', () => {
      isEnvTruthySpy.mockReturnValue(false);
      const prompt = coordinatorMode.getCoordinatorSystemPrompt();
      expect(prompt).toContain(
        'Workers have access to standard tools, MCP tools from configured MCP servers, and project skills'
      );
    });

    it('contains essential instructions', () => {
      const prompt = coordinatorMode.getCoordinatorSystemPrompt();
      expect(prompt).toContain(AGENT_TOOL_NAME);
      expect(prompt).toContain(SEND_MESSAGE_TOOL_NAME);
      expect(prompt).toContain(TASK_STOP_TOOL_NAME);
      expect(prompt).toContain('<task-notification>');
    });
  });
});
