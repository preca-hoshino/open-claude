import { describe, expect, it, mock, beforeEach } from 'bun:test';

const mockGetSettings = mock();
mock.module('../../utils/settings/settings.js', () => ({
  // biome-ignore lint/style/useNamingConvention: matches API
  getSettings_DEPRECATED: mockGetSettings,
}));

import {
  registerBuiltinPlugin,
  isBuiltinPluginId,
  getBuiltinPluginDefinition,
  getBuiltinPlugins,
  getBuiltinPluginSkillCommands,
  clearBuiltinPlugins,
  BUILTIN_MARKETPLACE_NAME,
} from '../builtinPlugins.js';

import type { BuiltinPluginDefinition } from '../../types/plugin.js';

describe('builtinPlugins', () => {
  beforeEach(() => {
    clearBuiltinPlugins();
    mockGetSettings.mockReset();
    mockGetSettings.mockReturnValue(undefined);
  });

  describe('isBuiltinPluginId', () => {
    it('should return true for IDs ending with @builtin', () => {
      expect(isBuiltinPluginId('my-plugin@builtin')).toBe(true);
    });

    it('should return false for IDs not ending with @builtin', () => {
      expect(isBuiltinPluginId('my-plugin@other')).toBe(false);
      expect(isBuiltinPluginId('builtin@my-plugin')).toBe(false);
    });
  });

  describe('registerBuiltinPlugin & getBuiltinPluginDefinition', () => {
    it('should register and retrieve a plugin definition', () => {
      const def: BuiltinPluginDefinition = {
        name: 'test-plugin',
        description: 'Test',
        version: '1.0.0',
      };
      registerBuiltinPlugin(def);
      expect(getBuiltinPluginDefinition('test-plugin')).toBe(def);
    });

    it('should return undefined for unregistered plugins', () => {
      expect(getBuiltinPluginDefinition('not-exist')).toBeUndefined();
    });
  });

  describe('getBuiltinPlugins', () => {
    it('should omit plugins that return false for isAvailable()', () => {
      registerBuiltinPlugin({
        name: 'hidden-plugin',
        description: 'Hidden',
        version: '1.0.0',
        isAvailable: () => false,
      });

      const { enabled, disabled } = getBuiltinPlugins();
      expect(enabled).toHaveLength(0);
      expect(disabled).toHaveLength(0);
    });

    it('should use defaultEnabled if user setting is not present', () => {
      registerBuiltinPlugin({
        name: 'default-enabled',
        description: 'Default enabled',
        version: '1.0.0',
        defaultEnabled: true,
      });
      registerBuiltinPlugin({
        name: 'default-disabled',
        description: 'Default disabled',
        version: '1.0.0',
        defaultEnabled: false,
      });
      // if defaultEnabled is undefined, it defaults to true
      registerBuiltinPlugin({
        name: 'default-fallback',
        description: 'No defaultEnabled',
        version: '1.0.0',
      });

      const { enabled, disabled } = getBuiltinPlugins();
      expect(enabled.map((p) => p.name).sort((a, b) => a.localeCompare(b))).toEqual([
        'default-enabled',
        'default-fallback',
      ]);
      expect(disabled.map((p) => p.name)).toEqual(['default-disabled']);
    });

    it('should prioritize user settings over defaultEnabled', () => {
      registerBuiltinPlugin({
        name: 'plugin-a',
        description: 'A',
        version: '1.0.0',
        defaultEnabled: true,
      });
      registerBuiltinPlugin({
        name: 'plugin-b',
        description: 'B',
        version: '1.0.0',
        defaultEnabled: false,
      });

      mockGetSettings.mockReturnValue({
        enabledPlugins: {
          'plugin-a@builtin': false,
          'plugin-b@builtin': true,
        },
      });

      const { enabled, disabled } = getBuiltinPlugins();
      expect(enabled.map((p) => p.name)).toEqual(['plugin-b']);
      expect(disabled.map((p) => p.name)).toEqual(['plugin-a']);
    });

    it('should correctly map LoadedPlugin properties', () => {
      registerBuiltinPlugin({
        name: 'full-plugin',
        description: 'Full',
        version: '1.0.0',
        defaultEnabled: true,
        hooks: {
          /* some hooks config */
        } as any,
        mcpServers: { server1: { command: 'node', args: [] } },
      });

      const { enabled } = getBuiltinPlugins();
      expect(enabled).toHaveLength(1);
      const plugin = enabled[0];

      expect(plugin).toEqual({
        name: 'full-plugin',
        manifest: {
          name: 'full-plugin',
          description: 'Full',
          version: '1.0.0',
        },
        path: BUILTIN_MARKETPLACE_NAME,
        source: `full-plugin@builtin`,
        repository: `full-plugin@builtin`,
        enabled: true,
        isBuiltin: true,
        hooksConfig: expect.anything(),
        mcpServers: { server1: { command: 'node', args: [] } },
      });
    });
  });

  describe('getBuiltinPluginSkillCommands', () => {
    it('should return skill commands from enabled plugins only', () => {
      const isEnabledMock = (): boolean => true;
      const getPromptMock = (): any => [];

      registerBuiltinPlugin({
        name: 'enabled-plugin',
        description: 'Enabled',
        version: '1.0.0',
        defaultEnabled: true,
        skills: [
          {
            name: 'skill1',
            description: 'S1',
            allowedTools: ['tool1'],
            argumentHint: 'hint1',
            whenToUse: 'when1',
            model: 'model1',
            disableModelInvocation: true,
            userInvocable: false,
            isEnabled: isEnabledMock,
            getPromptForCommand: getPromptMock,
          },
        ],
      });

      registerBuiltinPlugin({
        name: 'disabled-plugin',
        description: 'Disabled',
        version: '1.0.0',
        defaultEnabled: false,
        skills: [
          {
            name: 'skill2',
            description: 'S2',
            getPromptForCommand: (): any => [],
          },
        ],
      });

      // A plugin with no skills should be safely ignored
      registerBuiltinPlugin({
        name: 'no-skills',
        description: 'No skills',
        version: '1.0.0',
        defaultEnabled: true,
      });

      const cmds = getBuiltinPluginSkillCommands();
      expect(cmds).toHaveLength(1);

      const cmd = cmds[0] as any;
      expect(cmd.type).toBe('prompt');
      expect(cmd.name).toBe('skill1');
      expect(cmd.description).toBe('S1');
      expect(cmd.hasUserSpecifiedDescription).toBe(true);
      expect(cmd.allowedTools).toEqual(['tool1']);
      expect(cmd.argumentHint).toBe('hint1');
      expect(cmd.whenToUse).toBe('when1');
      expect(cmd.model).toBe('model1');
      expect(cmd.disableModelInvocation).toBe(true);
      expect(cmd.userInvocable).toBe(false);
      expect(cmd.contentLength).toBe(0);
      expect(cmd.source).toBe('bundled');
      expect(cmd.loadedFrom).toBe('bundled');
      expect(cmd.isEnabled).toBe(isEnabledMock);
      expect(cmd.isHidden).toBe(true);
      expect(cmd.progressMessage).toBe('running');
      expect(cmd.getPromptForCommand).toBe(getPromptMock);
    });

    it('should supply default logic for optional skill definition fields', () => {
      registerBuiltinPlugin({
        name: 'default-skill',
        description: 'Default',
        version: '1.0.0',
        defaultEnabled: true,
        skills: [
          {
            name: 'min-skill',
            description: 'Min',
            getPromptForCommand: (): any => [],
          },
        ],
      });

      const cmds = getBuiltinPluginSkillCommands();
      expect(cmds).toHaveLength(1);

      const cmd = cmds[0] as any;
      expect(cmd.allowedTools).toEqual([]);
      expect(cmd.disableModelInvocation).toBe(false);
      expect(cmd.userInvocable).toBe(true);
      expect(cmd.isHidden).toBe(false);
      expect(cmd.isEnabled?.()).toBe(true);
    });
  });
});
