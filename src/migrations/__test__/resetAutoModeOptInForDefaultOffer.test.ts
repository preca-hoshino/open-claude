import { describe, expect, it, mock, beforeEach } from 'bun:test';

const mockIsClassifierEnabled = mock(() => true);
const mockLogEvent = mock();
const mockGetGlobalConfig = mock();
const mockSaveGlobalConfig = mock();
const mockLogError = mock();
const mockGetAutoModeState = mock();
const mockGetSettingsForSource = mock();
const mockUpdateSettingsForSource = mock();

// Fix paths! relative to src/migrations/__test__/ resetAutoModeOptInForDefaultOffer.test.ts
mock.module('../../utils/permissions/autoModeState.js', () => ({
  isTranscriptClassifierEnabled: mockIsClassifierEnabled,
}));

mock.module('src/services/analytics/index.js', () => ({
  logEvent: mockLogEvent,
}));

mock.module('../../utils/config.js', () => ({
  getGlobalConfig: mockGetGlobalConfig,
  saveGlobalConfig: mockSaveGlobalConfig,
}));

mock.module('../../utils/log.js', () => ({
  logError: mockLogError,
}));

mock.module('../../utils/permissions/permissionSetup.js', () => ({
  // biome-ignore lint/style/useNamingConvention: matches original
  getAutoModeEnabledState: mockGetAutoModeState,
}));

mock.module('../../utils/settings/settings.js', () => ({
  getSettingsForSource: mockGetSettingsForSource,
  updateSettingsForSource: mockUpdateSettingsForSource,
}));

import { resetAutoModeOptInForDefaultOffer } from '../resetAutoModeOptInForDefaultOffer';

describe('resetAutoModeOptInForDefaultOffer', () => {
  beforeEach(() => {
    mockIsClassifierEnabled.mockReset();
    mockIsClassifierEnabled.mockReturnValue(true);
    mockLogEvent.mockReset();
    mockGetGlobalConfig.mockReset();
    mockSaveGlobalConfig.mockReset();
    mockLogError.mockReset();
    mockGetAutoModeState.mockReset();
    mockGetSettingsForSource.mockReset();
    mockUpdateSettingsForSource.mockReset();
  });

  it('should return if feature is not enabled', () => {
    mockIsClassifierEnabled.mockReturnValue(false);
    resetAutoModeOptInForDefaultOffer();
    expect(mockGetGlobalConfig).not.toHaveBeenCalled();
  });

  it('should return if already complete', () => {
    mockGetGlobalConfig.mockReturnValue({ hasResetAutoModeOptInForDefaultOffer: true });
    resetAutoModeOptInForDefaultOffer();
    expect(mockGetAutoModeState).not.toHaveBeenCalled();
  });

  it('should return if auto mode state is not enabled', () => {
    mockGetGlobalConfig.mockReturnValue({ hasResetAutoModeOptInForDefaultOffer: false });
    mockGetAutoModeState.mockReturnValue('opt-in');
    resetAutoModeOptInForDefaultOffer();
    expect(mockGetSettingsForSource).not.toHaveBeenCalled();
  });

  it('should reset opt-in if conditions are met', () => {
    mockGetGlobalConfig.mockReturnValue({ hasResetAutoModeOptInForDefaultOffer: false });
    mockGetAutoModeState.mockReturnValue('enabled');
    mockGetSettingsForSource.mockReturnValue({
      skipAutoPermissionPrompt: true,
      permissions: { defaultMode: 'manual' },
    });

    resetAutoModeOptInForDefaultOffer();

    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', {
      skipAutoPermissionPrompt: undefined,
    });
    expect(mockLogEvent).toHaveBeenCalledWith('tengu_migrate_reset_auto_opt_in_for_default_offer', {});
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
  });

  it('should not reset if default mode is already auto', () => {
    mockGetGlobalConfig.mockReturnValue({ hasResetAutoModeOptInForDefaultOffer: false });
    mockGetAutoModeState.mockReturnValue('enabled');
    mockGetSettingsForSource.mockReturnValue({
      skipAutoPermissionPrompt: true,
      permissions: { defaultMode: 'auto' },
    });

    resetAutoModeOptInForDefaultOffer();

    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
  });

  it('should log error on failure', () => {
    mockGetGlobalConfig.mockReturnValue({ hasResetAutoModeOptInForDefaultOffer: false });
    mockGetAutoModeState.mockReturnValue('enabled');
    mockGetSettingsForSource.mockImplementation(() => {
      throw new Error('fail');
    });

    resetAutoModeOptInForDefaultOffer();

    expect(mockLogError).toHaveBeenCalled();
  });

  it('should correctly set flag in config callback', () => {
    mockGetGlobalConfig.mockReturnValue({ hasResetAutoModeOptInForDefaultOffer: false });
    mockGetAutoModeState.mockReturnValue('enabled');
    mockGetSettingsForSource.mockReturnValue({});

    resetAutoModeOptInForDefaultOffer();

    const saveCallback = mockSaveGlobalConfig.mock.calls[0][0];
    const oldConfig = { some: 'val' };
    const newConfig = saveCallback(oldConfig);
    expect(newConfig.hasResetAutoModeOptInForDefaultOffer).toBe(true);
    expect(newConfig.some).toBe('val');
  });
});
