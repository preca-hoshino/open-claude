import { describe, expect, it, mock, beforeEach } from 'bun:test';

const mockSaveGlobalConfig = mock();

mock.module('../../utils/config.js', () => ({
  saveGlobalConfig: mockSaveGlobalConfig,
}));

import { migrateReplBridgeEnabledToRemoteControlAtStartup } from '../migrateReplBridgeEnabledToRemoteControlAtStartup';

describe('migrateReplBridgeEnabledToRemoteControlAtStartup', () => {
  beforeEach(() => {
    mockSaveGlobalConfig.mockReset();
  });

  it('should call saveGlobalConfig', () => {
    migrateReplBridgeEnabledToRemoteControlAtStartup();
    expect(mockSaveGlobalConfig).toHaveBeenCalled();
  });

  it('should migrate replBridgeEnabled in config callback', () => {
    migrateReplBridgeEnabledToRemoteControlAtStartup();
    const saveCallback = mockSaveGlobalConfig.mock.calls[0][0];

    const oldConfig = { replBridgeEnabled: true, other: 'val' };
    const newConfig = saveCallback(oldConfig);

    expect(newConfig.remoteControlAtStartup).toBe(true);
    expect(newConfig.replBridgeEnabled).toBeUndefined();
    expect(newConfig.other).toBe('val');
  });

  it('should return same config if replBridgeEnabled is missing', () => {
    migrateReplBridgeEnabledToRemoteControlAtStartup();
    const saveCallback = mockSaveGlobalConfig.mock.calls[0][0];

    const oldConfig = { other: 'val' };
    const newConfig = saveCallback(oldConfig);

    expect(newConfig).toBe(oldConfig);
  });

  it('should return same config if remoteControlAtStartup is already set', () => {
    migrateReplBridgeEnabledToRemoteControlAtStartup();
    const saveCallback = mockSaveGlobalConfig.mock.calls[0][0];

    const oldConfig = { replBridgeEnabled: true, remoteControlAtStartup: false };
    const newConfig = saveCallback(oldConfig);

    expect(newConfig).toBe(oldConfig);
  });
});
