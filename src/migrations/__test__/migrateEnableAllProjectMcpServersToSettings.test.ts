import { describe, expect, it, mock, beforeEach } from 'bun:test';

const mockLogEvent = mock();
const mockGetCurrentProjectConfig = mock();
const mockSaveCurrentProjectConfig = mock();
const mockLogError = mock();
const mockGetSettingsForSource = mock();
const mockUpdateSettingsForSource = mock();

mock.module('../../services/analytics/index.js', () => ({
  logEvent: mockLogEvent,
}));

mock.module('../../utils/config.js', () => ({
  getCurrentProjectConfig: mockGetCurrentProjectConfig,
  saveCurrentProjectConfig: mockSaveCurrentProjectConfig,
}));

mock.module('../../utils/log.js', () => ({
  logError: mockLogError,
}));

mock.module('../../utils/settings/settings.js', () => ({
  getSettingsForSource: mockGetSettingsForSource,
  updateSettingsForSource: mockUpdateSettingsForSource,
}));

import { migrateEnableAllProjectMcpServersToSettings } from '../migrateEnableAllProjectMcpServersToSettings';

describe('migrateEnableAllProjectMcpServersToSettings', () => {
  beforeEach(() => {
    mockLogEvent.mockReset();
    mockGetCurrentProjectConfig.mockReset();
    mockSaveCurrentProjectConfig.mockReset();
    mockLogError.mockReset();
    mockGetSettingsForSource.mockReset();
    mockUpdateSettingsForSource.mockReset();
  });

  it('should return if no migration needed', () => {
    mockGetCurrentProjectConfig.mockReturnValue({});
    migrateEnableAllProjectMcpServersToSettings();
    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
  });

  it('should migrate enableAllProjectMcpServers', () => {
    mockGetCurrentProjectConfig.mockReturnValue({ enableAllProjectMcpServers: true });
    mockGetSettingsForSource.mockReturnValue({});

    migrateEnableAllProjectMcpServersToSettings();

    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('localSettings', {
      enableAllProjectMcpServers: true,
    });
    expect(mockSaveCurrentProjectConfig).toHaveBeenCalled();
    expect(mockLogEvent).toHaveBeenCalledWith('tengu_migrate_mcp_approval_fields_success', { migratedCount: 1 });
  });

  it('should not migrate enableAllProjectMcpServers if already in settings, but still remove from config', () => {
    mockGetCurrentProjectConfig.mockReturnValue({ enableAllProjectMcpServers: true });
    mockGetSettingsForSource.mockReturnValue({ enableAllProjectMcpServers: false });

    migrateEnableAllProjectMcpServersToSettings();

    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
    expect(mockSaveCurrentProjectConfig).toHaveBeenCalled();
  });

  it('should migrate and merge enabled/disabled servers', () => {
    mockGetCurrentProjectConfig.mockReturnValue({
      enabledMcpjsonServers: ['s1', 's2'],
      disabledMcpjsonServers: ['s3'],
    });
    mockGetSettingsForSource.mockReturnValue({
      enabledMcpjsonServers: ['s2', 's4'],
      disabledMcpjsonServers: ['s5'],
    });

    migrateEnableAllProjectMcpServersToSettings();

    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('localSettings', {
      enabledMcpjsonServers: expect.arrayContaining(['s1', 's2', 's4']),
      disabledMcpjsonServers: expect.arrayContaining(['s3', 's5']),
    });
    expect(mockSaveCurrentProjectConfig).toHaveBeenCalled();
  });

  it('should handle errors', () => {
    mockGetCurrentProjectConfig.mockReturnValue({ enableAllProjectMcpServers: true });
    mockGetSettingsForSource.mockImplementation(() => {
      throw new Error('fail');
    });

    migrateEnableAllProjectMcpServersToSettings();

    expect(mockLogError).toHaveBeenCalled();
    expect(mockLogEvent).toHaveBeenCalledWith('tengu_migrate_mcp_approval_fields_error', {});
  });

  it('should correctly remove fields from project config', () => {
    mockGetCurrentProjectConfig.mockReturnValue({
      enableAllProjectMcpServers: true,
      enabledMcpjsonServers: ['s1'],
      disabledMcpjsonServers: ['s2'],
      other: 'stay',
    });
    mockGetSettingsForSource.mockReturnValue({});

    migrateEnableAllProjectMcpServersToSettings();

    const saveCallback = mockSaveCurrentProjectConfig.mock.calls[0][0];
    const oldConfig = {
      enableAllProjectMcpServers: true,
      enabledMcpjsonServers: ['s1'],
      disabledMcpjsonServers: ['s2'],
      other: 'stay',
    };
    const newConfig = saveCallback(oldConfig);
    expect(newConfig).toEqual({ other: 'stay' });
  });
});
