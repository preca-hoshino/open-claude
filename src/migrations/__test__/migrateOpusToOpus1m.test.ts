import { describe, expect, it, mock, beforeEach } from 'bun:test';

const mockLogEvent = mock();
const mockIsOpus1mMergeEnabled = mock();
const mockGetSettingsForSource = mock();
const mockUpdateSettingsForSource = mock();
const mockParseUserSpecifiedModel = mock();
const mockGetDefaultMainLoopModelSetting = mock();
const mockIsPro = mock();

mock.module('../../services/analytics/index.js', () => ({
  logEvent: mockLogEvent,
}));

mock.module('../../utils/auth.js', () => ({
  // biome-ignore lint/style/useNamingConvention: matches original
  isClaudeAISubscriber: mockIsPro,
}));

mock.module('../../utils/model/model.js', () => ({
  isOpus1mMergeEnabled: mockIsOpus1mMergeEnabled,
  parseUserSpecifiedModel: mockParseUserSpecifiedModel,
  getDefaultMainLoopModelSetting: mockGetDefaultMainLoopModelSetting,
}));

mock.module('../../utils/settings/settings.js', () => ({
  getSettingsForSource: mockGetSettingsForSource,
  updateSettingsForSource: mockUpdateSettingsForSource,
}));

import { migrateOpusToOpus1m } from '../migrateOpusToOpus1m';

describe('migrateOpusToOpus1m', () => {
  beforeEach(() => {
    mockLogEvent.mockReset();
    mockIsOpus1mMergeEnabled.mockReset();
    mockGetSettingsForSource.mockReset();
    mockUpdateSettingsForSource.mockReset();
    mockParseUserSpecifiedModel.mockReset();
    mockGetDefaultMainLoopModelSetting.mockReset();
  });

  it('should return if merge is not enabled', () => {
    mockIsOpus1mMergeEnabled.mockReturnValue(false);
    migrateOpusToOpus1m();
    expect(mockGetSettingsForSource).not.toHaveBeenCalled();
  });

  it('should return if model is not opus', () => {
    mockIsOpus1mMergeEnabled.mockReturnValue(true);
    mockGetSettingsForSource.mockReturnValue({ model: 'sonnet' });
    migrateOpusToOpus1m();
    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
  });

  it('should migrate opus to opus[1m] if it is not the default', () => {
    mockIsOpus1mMergeEnabled.mockReturnValue(true);
    mockGetSettingsForSource.mockReturnValue({ model: 'opus' });

    // Different parsed models
    mockParseUserSpecifiedModel.mockImplementation((m: string) => m);
    mockGetDefaultMainLoopModelSetting.mockReturnValue('default-model');

    migrateOpusToOpus1m();

    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', { model: 'opus[1m]' });
    expect(mockLogEvent).toHaveBeenCalledWith('tengu_opus_to_opus1m_migration', {});
  });

  it('should unset model if migrated model matches default', () => {
    mockIsOpus1mMergeEnabled.mockReturnValue(true);
    mockGetSettingsForSource.mockReturnValue({ model: 'opus' });

    // Same parsed models
    mockParseUserSpecifiedModel.mockReturnValue('resolved-model');
    mockGetDefaultMainLoopModelSetting.mockReturnValue('default-model');

    migrateOpusToOpus1m();

    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', { model: undefined });
  });

  it('should handle missing settings', () => {
    mockIsOpus1mMergeEnabled.mockReturnValue(true);
    mockGetSettingsForSource.mockReturnValue(null);
    migrateOpusToOpus1m();
    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
  });
});
