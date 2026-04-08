import { describe, expect, it, mock, beforeEach } from 'bun:test';

const mockLogEvent = mock();
const mockIsPro = mock();
const mockIsMax = mock();
const mockIsTeam = mock();
const mockGetApiProvider = mock();
const mockUpdateSettingsForSource = mock();
const mockGetSettingsForSource = mock();
const mockGetGlobalConfig = mock();
const mockSaveGlobalConfig = mock();

mock.module('../../services/analytics/index.js', () => ({
  logEvent: mockLogEvent,
}));

mock.module('../../utils/auth.js', () => ({
  isProSubscriber: mockIsPro,
  isMaxSubscriber: mockIsMax,
  isTeamPremiumSubscriber: mockIsTeam,
}));

mock.module('../../utils/model/providers.js', () => ({
  // biome-ignore lint/style/useNamingConvention: matches original
  getAPIProvider: mockGetApiProvider,
}));

mock.module('../../utils/settings/settings.js', () => ({
  getSettingsForSource: mockGetSettingsForSource,
  updateSettingsForSource: mockUpdateSettingsForSource,
}));

mock.module('../../utils/config.js', () => ({
  getGlobalConfig: mockGetGlobalConfig,
  saveGlobalConfig: mockSaveGlobalConfig,
}));

import { migrateSonnet45ToSonnet46 } from '../migrateSonnet45ToSonnet46';

describe('migrateSonnet45ToSonnet46', () => {
  beforeEach(() => {
    mockLogEvent.mockReset();
    mockIsPro.mockReset();
    mockIsMax.mockReset();
    mockIsTeam.mockReset();
    mockGetApiProvider.mockReset();
    mockUpdateSettingsForSource.mockReset();
    mockGetGlobalConfig.mockReset();
    mockSaveGlobalConfig.mockReset();
    mockGetSettingsForSource.mockReset();

    mockGetGlobalConfig.mockReturnValue({ numStartups: 5 });
    mockIsPro.mockReturnValue(false);
    mockIsMax.mockReturnValue(false);
    mockIsTeam.mockReturnValue(false);
  });

  const testCases = [
    { model: 'claude-sonnet-4-5-20250929', expected: 'sonnet' },
    { model: 'claude-sonnet-4-5-20250929[1m]', expected: 'sonnet[1m]' },
    { model: 'sonnet-4-5-20250929', expected: 'sonnet' },
    { model: 'sonnet-4-5-20250929[1m]', expected: 'sonnet[1m]' },
    { model: 'opus', expected: 'opus' },
  ];

  for (const testCase of testCases) {
    it(`should handle ${testCase.model}`, () => {
      mockGetSettingsForSource.mockReturnValue({ model: testCase.model });
      mockGetApiProvider.mockReturnValue('firstParty');
      mockIsPro.mockReturnValue(true);

      migrateSonnet45ToSonnet46();

      if (testCase.model !== testCase.expected && testCase.expected.startsWith('sonnet')) {
        expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', {
          model: testCase.expected,
        });
        // biome-ignore lint/style/useNamingConvention: matches original
        expect(mockLogEvent).toHaveBeenCalledWith('tengu_sonnet45_to_46_migration', expect.any(Object));
      } else {
        expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
      }
    });
  }

  it('should skip migration if not firstParty', () => {
    mockGetSettingsForSource.mockReturnValue({ model: 'sonnet-4-5-20250929' });
    mockGetApiProvider.mockReturnValue('vertex');
    migrateSonnet45ToSonnet46();
    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
  });

  it('should skip migration if not pro/max/team subscriber', () => {
    mockGetSettingsForSource.mockReturnValue({ model: 'sonnet-4-5-20250929' });
    mockGetApiProvider.mockReturnValue('firstParty');
    mockIsPro.mockReturnValue(false);
    mockIsMax.mockReturnValue(false);
    mockIsTeam.mockReturnValue(false);
    migrateSonnet45ToSonnet46();
    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
  });

  it('should set timestamp only if numStartups > 1', () => {
    mockGetSettingsForSource.mockReturnValue({ model: 'sonnet-4-5-20250929' });
    mockGetApiProvider.mockReturnValue('firstParty');
    mockIsPro.mockReturnValue(true);

    // Test numStartups > 1
    mockGetGlobalConfig.mockReturnValue({ numStartups: 5 });
    migrateSonnet45ToSonnet46();
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
    const saveCallback = mockSaveGlobalConfig.mock.calls[0][0];
    const newConfig = saveCallback({ numStartups: 5 });
    expect(newConfig.sonnet45To46MigrationTimestamp).toBeDefined();

    // Test numStartups <= 1
    mockSaveGlobalConfig.mockReset();
    mockGetGlobalConfig.mockReturnValue({ numStartups: 1 });
    migrateSonnet45ToSonnet46();
    expect(mockSaveGlobalConfig).not.toHaveBeenCalled();
  });
});
