import { describe, expect, it, mock, beforeEach } from 'bun:test';

const mockLogEvent = mock();
const mockIsPro = mock();
const mockGetApiProvider = mock();
const mockUpdateSettingsForSource = mock();
const mockGetSettingsForSource = mock();
const mockSaveGlobalConfig = mock();
const mockIsLegacyModelRemapEnabled = mock();

mock.module('../../services/analytics/index.js', () => ({
  logEvent: mockLogEvent,
}));

mock.module('../../utils/auth.js', () => ({
  // biome-ignore lint/style/useNamingConvention: matches original
  isClaudeAISubscriber: mockIsPro,
}));

mock.module('../../utils/model/providers.js', () => ({
  // biome-ignore lint/style/useNamingConvention: matches original
  getAPIProvider: mockGetApiProvider,
}));

mock.module('../../utils/model/model.js', () => ({
  isLegacyModelRemapEnabled: mockIsLegacyModelRemapEnabled,
}));

mock.module('../../utils/settings/settings.js', () => ({
  getSettingsForSource: mockGetSettingsForSource,
  updateSettingsForSource: mockUpdateSettingsForSource,
}));

mock.module('../../utils/config.js', () => ({
  saveGlobalConfig: mockSaveGlobalConfig,
}));

import { migrateLegacyOpusToCurrent } from '../migrateLegacyOpusToCurrent';

describe('migrateLegacyOpusToCurrent', () => {
  beforeEach(() => {
    mockLogEvent.mockReset();
    mockIsPro.mockReset();
    mockGetApiProvider.mockReset();
    mockUpdateSettingsForSource.mockReset();
    mockSaveGlobalConfig.mockReset();
    mockGetSettingsForSource.mockReset();
    mockIsLegacyModelRemapEnabled.mockReset();
    mockIsLegacyModelRemapEnabled.mockReturnValue(true);
  });

  const legacyModels = ['claude-opus-4-20250514', 'claude-opus-4-1-20250805', 'claude-opus-4-0', 'claude-opus-4-1'];

  for (const legacyModel of legacyModels) {
    it(`should migrate ${legacyModel} to opus`, () => {
      mockGetSettingsForSource.mockReturnValue({ model: legacyModel });
      mockGetApiProvider.mockReturnValue('firstParty');
      mockIsPro.mockReturnValue(true);

      migrateLegacyOpusToCurrent();

      expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', { model: 'opus' });
      expect(mockSaveGlobalConfig).toHaveBeenCalled();

      expect(mockLogEvent).toHaveBeenCalledWith('tengu_legacy_opus_migration', {
        // biome-ignore lint/style/useNamingConvention: matches original
        from_model: legacyModel,
      });
    });
  }

  it('should skip if not firstParty', () => {
    mockGetSettingsForSource.mockReturnValue({ model: 'claude-opus-4-0' });
    mockGetApiProvider.mockReturnValue('bedrock');
    migrateLegacyOpusToCurrent();
    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
  });

  it('should skip if not legacy remapping enabled', () => {
    mockGetSettingsForSource.mockReturnValue({ model: 'claude-opus-4-0' });
    mockGetApiProvider.mockReturnValue('firstParty');
    mockIsLegacyModelRemapEnabled.mockReturnValue(false);
    migrateLegacyOpusToCurrent();
    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
  });

  it('should check saveGlobalConfig callback', () => {
    mockGetSettingsForSource.mockReturnValue({ model: legacyModels[0] });
    mockGetApiProvider.mockReturnValue('firstParty');
    mockIsPro.mockReturnValue(true);

    migrateLegacyOpusToCurrent();

    const saveCallback = mockSaveGlobalConfig.mock.calls[0][0];
    const newConfig = saveCallback({ other: 'val' });
    expect(newConfig.legacyOpusMigrationTimestamp).toBeDefined();
    expect(newConfig.other).toBe('val');
  });
});
