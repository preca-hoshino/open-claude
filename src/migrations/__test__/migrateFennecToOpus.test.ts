import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';

const mockGetSettingsForSource = mock();
const mockUpdateSettingsForSource = mock();

mock.module('../../utils/settings/settings.js', () => ({
  getSettingsForSource: mockGetSettingsForSource,
  updateSettingsForSource: mockUpdateSettingsForSource,
}));

import { migrateFennecToOpus } from '../migrateFennecToOpus';

describe('migrateFennecToOpus', () => {
  let originalUserType: string | undefined;

  beforeEach(() => {
    originalUserType = process.env.USER_TYPE;
    mockGetSettingsForSource.mockReset();
    mockUpdateSettingsForSource.mockReset();
    process.env.USER_TYPE = 'ant';
  });

  afterEach(() => {
    process.env.USER_TYPE = originalUserType;
  });

  it('should return if USER_TYPE is not ant', () => {
    process.env.USER_TYPE = 'other';
    migrateFennecToOpus();
    expect(mockGetSettingsForSource).not.toHaveBeenCalled();
  });

  it('should migrate fennec-latest[1m] to opus[1m]', () => {
    mockGetSettingsForSource.mockReturnValue({ model: 'fennec-latest[1m]' });
    migrateFennecToOpus();
    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', {
      model: 'opus[1m]',
    });
  });

  it('should migrate fennec-latest to opus', () => {
    mockGetSettingsForSource.mockReturnValue({ model: 'fennec-latest' });
    migrateFennecToOpus();
    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', {
      model: 'opus',
    });
  });

  it('should migrate fennec-fast-latest to opus[1m] + fastMode', () => {
    mockGetSettingsForSource.mockReturnValue({ model: 'fennec-fast-latest' });
    migrateFennecToOpus();
    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', {
      model: 'opus[1m]',
      fastMode: true,
    });
  });

  it('should migrate opus-4-5-fast to opus[1m] + fastMode', () => {
    mockGetSettingsForSource.mockReturnValue({ model: 'opus-4-5-fast' });
    migrateFennecToOpus();
    expect(mockUpdateSettingsForSource).toHaveBeenCalledWith('userSettings', {
      model: 'opus[1m]',
      fastMode: true,
    });
  });

  it('should do nothing if model is not fennec', () => {
    mockGetSettingsForSource.mockReturnValue({ model: 'claude-3-sonnet' });
    migrateFennecToOpus();
    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
  });

  it('should handle missing settings', () => {
    mockGetSettingsForSource.mockReturnValue(null);
    migrateFennecToOpus();
    expect(mockUpdateSettingsForSource).not.toHaveBeenCalled();
  });
});
