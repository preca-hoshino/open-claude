import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';

const mockLogEvent = mock();
const mockGetGlobalConfig = mock();
const mockSaveGlobalConfig = mock();
const mockLogError = mock();
const mockGetSettingsForSource = mock();
const mockUpdateSettingsForSource = mock();

mock.module('../../services/analytics/index.js', () => ({
  logEvent: mockLogEvent,
}));

mock.module('../../utils/config.js', () => ({
  getGlobalConfig: mockGetGlobalConfig,
  saveGlobalConfig: mockSaveGlobalConfig,
}));

mock.module('../../utils/log.js', () => ({
  logError: mockLogError,
}));

mock.module('../../utils/settings/settings.js', () => ({
  getSettingsForSource: mockGetSettingsForSource,
  updateSettingsForSource: mockUpdateSettingsForSource,
}));

import { migrateAutoUpdatesToSettings } from '../migrateAutoUpdatesToSettings';

describe('migrateAutoUpdatesToSettings', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockLogEvent.mockReset();
    mockGetGlobalConfig.mockReset();
    mockSaveGlobalConfig.mockReset();
    mockLogError.mockReset();
    mockGetSettingsForSource.mockReset();
    mockUpdateSettingsForSource.mockReset();
    process.env.DISABLE_AUTOUPDATER = undefined;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should migrate autoupdates from global config to settings', () => {
    mockGetGlobalConfig.mockReturnValue({ autoUpdates: false });
    const userSettings = { env: {} };
    mockGetSettingsForSource.mockReturnValue(userSettings);

    migrateAutoUpdatesToSettings();

    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', {
      env: {
        // biome-ignore lint/style/useNamingConvention: matches original env var
        DISABLE_AUTOUPDATER: '1',
      },
    });
    expect(process.env.DISABLE_AUTOUPDATER).toBe('1');
    expect(mockLogEvent).toHaveBeenCalledWith('tengu_migrate_autoupdates_to_settings', {
      // biome-ignore lint/style/useNamingConvention: matches original
      was_user_preference: true,
      // biome-ignore lint/style/useNamingConvention: matches original
      already_had_env_var: false,
    });
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
  });

  it('should handle missing userSettings.env', () => {
    mockGetGlobalConfig.mockReturnValue({ autoUpdates: false });
    mockGetSettingsForSource.mockReturnValue(null);

    migrateAutoUpdatesToSettings();

    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', {
      env: {
        // biome-ignore lint/style/useNamingConvention: matches original env var
        DISABLE_AUTOUPDATER: '1',
      },
    });
  });

  it('should log error on failure', () => {
    mockGetGlobalConfig.mockReturnValue({ autoUpdates: false });
    mockGetSettingsForSource.mockImplementation(() => {
      throw new Error('Test Error');
    });

    migrateAutoUpdatesToSettings();

    expect(mockLogError).toHaveBeenCalled();
    expect(mockLogEvent).toHaveBeenCalledWith('tengu_migrate_autoupdates_error', {
      // biome-ignore lint/style/useNamingConvention: matches original
      has_error: true,
    });
  });

  it('should correctly remove autoUpdates from config in saveGlobalConfig callback', () => {
    mockGetGlobalConfig.mockReturnValue({ autoUpdates: false });
    mockGetSettingsForSource.mockReturnValue({});

    migrateAutoUpdatesToSettings();

    expect(mockSaveGlobalConfig).toHaveBeenCalled();
    const saveCallback = mockSaveGlobalConfig.mock.calls[0][0];
    const oldConfig = { autoUpdates: false, other: 'val' };
    const newConfig = saveCallback(oldConfig);
    expect(newConfig.autoUpdates).toBeUndefined();
    expect(newConfig.other).toBe('val');
  });
});
