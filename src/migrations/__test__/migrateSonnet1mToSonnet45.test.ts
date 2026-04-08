import { describe, expect, it, mock, beforeEach } from 'bun:test';

const mockGetGlobalConfig = mock();
const mockSaveGlobalConfig = mock();
const mockGetSettingsForSource = mock();
const mockUpdateSettingsForSource = mock();
const mockGetMainLoopModelOverride = mock();
const mockSetMainLoopModelOverride = mock();
const mockIsPro = mock();

mock.module('../../utils/auth.js', () => ({
  // biome-ignore lint/style/useNamingConvention: matches original
  isClaudeAISubscriber: mockIsPro,
}));

mock.module('../../utils/config.js', () => ({
  getGlobalConfig: mockGetGlobalConfig,
  saveGlobalConfig: mockSaveGlobalConfig,
}));

mock.module('../../utils/settings/settings.js', () => ({
  getSettingsForSource: mockGetSettingsForSource,
  updateSettingsForSource: mockUpdateSettingsForSource,
}));

mock.module('../../bootstrap/state.js', () => ({
  getMainLoopModelOverride: mockGetMainLoopModelOverride,
  setMainLoopModelOverride: mockSetMainLoopModelOverride,
}));

import { migrateSonnet1mToSonnet45 } from '../migrateSonnet1mToSonnet45';

describe('migrateSonnet1mToSonnet45', () => {
  beforeEach(() => {
    mockGetGlobalConfig.mockReset();
    mockSaveGlobalConfig.mockReset();
    mockGetSettingsForSource.mockReset();
    mockUpdateSettingsForSource.mockReset();
    mockGetMainLoopModelOverride.mockReset();
    mockSetMainLoopModelOverride.mockReset();
  });

  it('should return if already complete', () => {
    mockGetGlobalConfig.mockReturnValue({ sonnet1m45MigrationComplete: true });
    migrateSonnet1mToSonnet45();
    expect(mockGetSettingsForSource).not.toHaveBeenCalled();
  });

  it('should migrate sonnet[1m] and set completion flag', () => {
    mockGetGlobalConfig.mockReturnValue({ sonnet1m45MigrationComplete: false });
    mockGetSettingsForSource.mockReturnValue({ model: 'sonnet[1m]' });
    mockGetMainLoopModelOverride.mockReturnValue('sonnet[1m]');

    migrateSonnet1mToSonnet45();

    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', {
      model: 'sonnet-4-5-20250929[1m]',
    });
    expect(mockSetMainLoopModelOverride).toHaveBeenCalledWith('sonnet-4-5-20250929[1m]');
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
  });

  it('should only set completion flag if model is not sonnet[1m]', () => {
    mockGetGlobalConfig.mockReturnValue({ sonnet1m45MigrationComplete: false });
    mockGetSettingsForSource.mockReturnValue({ model: 'other' });

    migrateSonnet1mToSonnet45();

    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
  });

  it('should handle missing settings', () => {
    mockGetGlobalConfig.mockReturnValue({ sonnet1m45MigrationComplete: false });
    mockGetSettingsForSource.mockReturnValue(null);

    migrateSonnet1mToSonnet45();

    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
  });

  it('should correctly set flag in config callback', () => {
    mockGetGlobalConfig.mockReturnValue({ sonnet1m45MigrationComplete: false });
    mockGetSettingsForSource.mockReturnValue({});

    migrateSonnet1mToSonnet45();

    const saveCallback = mockSaveGlobalConfig.mock.calls[0][0];
    const oldConfig = { other: 'val' };
    const newConfig = saveCallback(oldConfig);
    expect(newConfig.sonnet1m45MigrationComplete).toBe(true);
    expect(newConfig.other).toBe('val');
  });
});
