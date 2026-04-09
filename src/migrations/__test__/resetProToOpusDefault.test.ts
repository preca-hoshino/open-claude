import { describe, expect, it, mock, beforeEach } from 'bun:test';

const mockLogEvent = mock();
const mockIsPro = mock();
const mockGetGlobalConfig = mock();
const mockSaveGlobalConfig = mock();
const mockGetApiProvider = mock();
const mockGetSettingsDeprecated = mock();

mock.module('../../services/analytics/index.js', () => ({
  logEvent: mockLogEvent,
}));

mock.module('../../utils/auth.js', () => ({
  isProSubscriber: mockIsPro,
}));

mock.module('../../utils/config.js', () => ({
  getGlobalConfig: mockGetGlobalConfig,
  saveGlobalConfig: mockSaveGlobalConfig,
}));

mock.module('../../utils/model/providers.js', () => ({
  // biome-ignore lint/style/useNamingConvention: matches original
  getAPIProvider: mockGetApiProvider,
}));

mock.module('../../utils/settings/settings.js', () => ({
  // biome-ignore lint/style/useNamingConvention: matches original
  getSettings_DEPRECATED: mockGetSettingsDeprecated,
}));

import { resetProToOpusDefault } from '../resetProToOpusDefault';

describe('resetProToOpusDefault', () => {
  beforeEach(() => {
    mockLogEvent.mockReset();
    mockIsPro.mockReset();
    mockGetGlobalConfig.mockReset();
    mockSaveGlobalConfig.mockReset();
    mockGetApiProvider.mockReset();
    mockGetSettingsDeprecated.mockReset();
  });

  it('should return if already complete', () => {
    mockGetGlobalConfig.mockReturnValue({ opusProMigrationComplete: true });
    resetProToOpusDefault();
    expect(mockGetApiProvider).not.toHaveBeenCalled();
  });

  it('should mark complete and log skipped if not firstParty or not pro', () => {
    mockGetGlobalConfig.mockReturnValue({ opusProMigrationComplete: false });

    // Test not first party
    mockGetApiProvider.mockReturnValue('vertex');
    resetProToOpusDefault();
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
    expect(mockLogEvent).toHaveBeenCalledWith('tengu_reset_pro_to_opus_default', { skipped: true });

    mockSaveGlobalConfig.mockReset();
    mockLogEvent.mockReset();

    // Test not pro
    mockGetApiProvider.mockReturnValue('firstParty');
    mockIsPro.mockReturnValue(false);
    resetProToOpusDefault();
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
    expect(mockLogEvent).toHaveBeenCalledWith('tengu_reset_pro_to_opus_default', { skipped: true });
  });

  it('should migrate if no custom model is set', () => {
    mockGetGlobalConfig.mockReturnValue({ opusProMigrationComplete: false });
    mockGetApiProvider.mockReturnValue('firstParty');
    mockIsPro.mockReturnValue(true);
    mockGetSettingsDeprecated.mockReturnValue({ model: undefined });

    resetProToOpusDefault();

    expect(mockSaveGlobalConfig).toHaveBeenCalled();
    const saveCallback = mockSaveGlobalConfig.mock.calls[0][0];
    const newConfig = saveCallback({ other: 'val' });
    expect(newConfig.opusProMigrationComplete).toBe(true);
    expect(newConfig.opusProMigrationTimestamp).toBeDefined();

    expect(mockLogEvent).toHaveBeenCalledWith('tengu_reset_pro_to_opus_default', {
      skipped: false,
      // biome-ignore lint/style/useNamingConvention: matches original
      had_custom_model: false,
    });
  });

  it('should skip notification if custom model is set', () => {
    mockGetGlobalConfig.mockReturnValue({ opusProMigrationComplete: false });
    mockGetApiProvider.mockReturnValue('firstParty');
    mockIsPro.mockReturnValue(true);
    mockGetSettingsDeprecated.mockReturnValue({ model: 'sonnet' });

    resetProToOpusDefault();

    expect(mockSaveGlobalConfig).toHaveBeenCalled();
    const saveCallback = mockSaveGlobalConfig.mock.calls[0][0];
    const newConfig = saveCallback({ other: 'val' });
    expect(newConfig.opusProMigrationComplete).toBe(true);
    expect(newConfig.opusProMigrationTimestamp).toBeUndefined();

    expect(mockLogEvent).toHaveBeenCalledWith('tengu_reset_pro_to_opus_default', {
      skipped: false,
      // biome-ignore lint/style/useNamingConvention: matches original
      had_custom_model: true,
    });
  });
});
