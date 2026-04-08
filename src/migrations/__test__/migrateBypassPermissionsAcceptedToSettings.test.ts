import { describe, expect, it, mock, beforeEach } from 'bun:test';

const mockLogEvent = mock();
const mockGetGlobalConfig = mock();
const mockSaveGlobalConfig = mock();
const mockLogError = mock();
const mockHasSkipPrompt = mock();
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
  hasSkipDangerousModePermissionPrompt: mockHasSkipPrompt,
  updateSettingsForSource: mockUpdateSettingsForSource,
}));

import { migrateBypassPermissionsAcceptedToSettings } from '../migrateBypassPermissionsAcceptedToSettings';

describe('migrateBypassPermissionsAcceptedToSettings', () => {
  beforeEach(() => {
    mockLogEvent.mockReset();
    mockGetGlobalConfig.mockReset();
    mockSaveGlobalConfig.mockReset();
    mockLogError.mockReset();
    mockHasSkipPrompt.mockReset();
    mockUpdateSettingsForSource.mockReset();
  });

  it('should return if bypassPermissionsModeAccepted is not set', () => {
    mockGetGlobalConfig.mockReturnValue({ bypassPermissionsModeAccepted: false });
    migrateBypassPermissionsAcceptedToSettings();
    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
  });

  it('should migrate to settings if skip prompt is not already set', () => {
    mockGetGlobalConfig.mockReturnValue({ bypassPermissionsModeAccepted: true });
    mockHasSkipPrompt.mockReturnValue(false);

    migrateBypassPermissionsAcceptedToSettings();

    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', {
      skipDangerousModePermissionPrompt: true,
    });
    expect(mockLogEvent).toHaveBeenCalledWith('tengu_migrate_bypass_permissions_accepted', {});
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
  });

  it('should not update settings if skip prompt is already set, but still migrate config', () => {
    mockGetGlobalConfig.mockReturnValue({ bypassPermissionsModeAccepted: true });
    mockHasSkipPrompt.mockReturnValue(true);

    migrateBypassPermissionsAcceptedToSettings();

    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
  });

  it('should log error on failure', () => {
    mockGetGlobalConfig.mockReturnValue({ bypassPermissionsModeAccepted: true });
    mockHasSkipPrompt.mockImplementation(() => {
      throw new Error('Test Error');
    });

    migrateBypassPermissionsAcceptedToSettings();

    expect(mockLogError).toHaveBeenCalled();
  });

  it('should correctly remove bypassPermissionsModeAccepted from config', () => {
    mockGetGlobalConfig.mockReturnValue({ bypassPermissionsModeAccepted: true });
    mockHasSkipPrompt.mockReturnValue(true);

    migrateBypassPermissionsAcceptedToSettings();

    const saveCallback = mockSaveGlobalConfig.mock.calls[0][0];
    const oldConfig = { bypassPermissionsModeAccepted: true, other: 'val' };
    const newConfig = saveCallback(oldConfig);
    expect(newConfig).toEqual({ other: 'val' });

    // Test idempotent if key not in config
    const emptyConfig = { other: 'val' };
    expect(saveCallback(emptyConfig)).toEqual(emptyConfig);
  });
});
