import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import {
  configureDevConfigDir,
  getDefaultDevConfigDir,
  installRuntimeGlobals,
  readDefaultCredentials,
  readLocalVersion,
} from '../installRuntimeGlobals.js';

const mockReadFileSync = mock();
const mockExistsSync = mock();
const mockMkdirSync = mock();
const mockWriteFileSync = mock();
const mockChmodSync = mock();
const mockJoin = mock();
const mockGetSecureStorage = mock();

mock.module('fs', () => ({
  readFileSync: mockReadFileSync,
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  writeFileSync: mockWriteFileSync,
  chmodSync: mockChmodSync,
  default: {
    readFileSync: mockReadFileSync,
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    writeFileSync: mockWriteFileSync,
    chmodSync: mockChmodSync,
  },
}));

mock.module('path', () => ({
  join: mockJoin,
  default: { join: mockJoin },
}));

mock.module('../../utils/secureStorage/index.js', () => ({
  getSecureStorage: mockGetSecureStorage,
}));

describe('installRuntimeGlobals functions', () => {
  const originalEnv = { ...process.env };
  let originalMacro: any;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CLAUDE_CONFIG_DIR = undefined;
    process.env.HOME = undefined;
    process.env.CLAUDE_CODE_DEV_CONFIG_DIR = undefined;
    process.env.CLAUDE_CODE_DEV_VERSION = undefined;
    process.env.CLAUDE_CODE_DEV_BUILD_TIME = undefined;
    process.env.CLAUDE_CODE_NATIVE_PACKAGE_URL = undefined;
    process.env.CLAUDE_CODE_DEV_CHANGELOG = undefined;

    originalMacro = globalThis.MACRO;
    (globalThis as any).MACRO = undefined;

    mockReadFileSync.mockReset();
    mockExistsSync.mockReset();
    mockMkdirSync.mockReset();
    mockWriteFileSync.mockReset();
    mockChmodSync.mockReset();
    mockJoin.mockReset().mockImplementation((...args: any[]) => args.filter(Boolean).join('/'));
    mockGetSecureStorage.mockReset().mockReturnValue({ read: mock().mockReturnValue(null) });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.MACRO = originalMacro;
  });

  test('readLocalVersion: should use fallback version if reading package.json fails', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('Not found');
    });
    expect(readLocalVersion()).toBe('2.1.88-source.0');
  });

  test('readLocalVersion: should use version from package.json if available', () => {
    mockReadFileSync.mockImplementation((p: unknown) => {
      if (typeof p === 'string' || p instanceof URL) {
        if (p.toString().includes('package.json')) {
          return JSON.stringify({ version: '3.0.0-test' });
        }
      }
      throw new Error('Not found');
    });
    expect(readLocalVersion()).toBe('3.0.0-test');
  });

  test('readLocalVersion: should fall back if package.json has empty string version', () => {
    mockReadFileSync.mockImplementation((p: unknown) => {
      if (typeof p === 'string' || p instanceof URL) {
        if (p.toString().includes('package.json')) {
          return JSON.stringify({ version: '' });
        }
      }
      throw new Error('Not found');
    });
    expect(readLocalVersion()).toBe('2.1.88-source.0');
  });

  test('getDefaultDevConfigDir: uses CLAUDE_CODE_DEV_CONFIG_DIR env var first', () => {
    process.env.CLAUDE_CODE_DEV_CONFIG_DIR = '/custom/dev/.claude-dev';
    expect(getDefaultDevConfigDir()).toBe('/custom/dev/.claude-dev');
  });

  test('getDefaultDevConfigDir: uses process.cwd if env var missing', () => {
    const cwdPath = process.cwd();
    mockJoin.mockImplementation((...args: any[]) => {
      if (args[0] === cwdPath) {
        return `${cwdPath}/.claude-dev`;
      }
      return args.filter(Boolean).join('/');
    });
    expect(getDefaultDevConfigDir()).toBe(`${cwdPath}/.claude-dev`);
  });

  test('readDefaultCredentials: returns credentials from host file if exists', () => {
    process.env.HOME = '/home/user';
    mockJoin.mockImplementation((...args: any[]) => args.filter(Boolean).join('/'));
    mockExistsSync.mockImplementation((p: unknown) => {
      return typeof p === 'string' && p === '/home/user/.claude/.credentials.json';
    });
    mockReadFileSync.mockImplementation((p: unknown) => {
      if (typeof p === 'string' && p === '/home/user/.claude/.credentials.json') {
        return 'mock-host-credentials';
      }
      return '';
    });
    expect(readDefaultCredentials()).toBe('mock-host-credentials');
  });

  test('readDefaultCredentials: returns from secureStorage if HOME missing', () => {
    mockExistsSync.mockReturnValue(false);
    const mockStorageRead = mock().mockReturnValue({ token: 'mock-token' });
    mockGetSecureStorage.mockReturnValue({ read: mockStorageRead });

    expect(readDefaultCredentials()).toBe(JSON.stringify({ token: 'mock-token' }));
  });

  test('readDefaultCredentials: returns null if both empty', () => {
    mockExistsSync.mockReturnValue(false);
    const mockStorageRead = mock().mockReturnValue({});
    mockGetSecureStorage.mockReturnValue({ read: mockStorageRead });

    expect(readDefaultCredentials()).toBeNull();
  });

  test('configureDevConfigDir: does nothing if CLAUDE_CONFIG_DIR is set', () => {
    process.env.CLAUDE_CONFIG_DIR = 'existing/dir';
    configureDevConfigDir();
    expect(mockMkdirSync).toHaveBeenCalledTimes(0);
  });

  test('configureDevConfigDir: creates dir and copies credentials from HOME', () => {
    process.env.HOME = '/home/user';
    process.env.CLAUDE_CODE_DEV_CONFIG_DIR = '/custom/dev/dir';

    mockExistsSync.mockImplementation((p: unknown) => {
      return typeof p === 'string' && p === '/home/user/.claude/.credentials.json';
    });
    mockReadFileSync.mockImplementation((p: unknown) => {
      if (typeof p === 'string' && p === '/home/user/.claude/.credentials.json') {
        return 'mock-host-credentials';
      }
      return '';
    });

    configureDevConfigDir();

    expect(mockMkdirSync).toHaveBeenCalledWith('/custom/dev/dir', { recursive: true });
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/custom/dev/dir/.credentials.json',
      'mock-host-credentials',
      'utf8'
    );
    expect(mockChmodSync).toHaveBeenCalledWith('/custom/dev/dir/.credentials.json', 0o600);
    expect(process.env.CLAUDE_CONFIG_DIR).toBe('/custom/dev/dir');
  });

  test('configureDevConfigDir: works if readDefaultCredentials returns null', () => {
    process.env.CLAUDE_CODE_DEV_CONFIG_DIR = '/custom/dev/dir';

    mockExistsSync.mockReturnValue(false);
    mockGetSecureStorage.mockReturnValue({ read: mock().mockReturnValue(null) });

    configureDevConfigDir();
    expect(mockMkdirSync).toHaveBeenCalledWith('/custom/dev/dir', { recursive: true });
    expect(mockWriteFileSync).toHaveBeenCalledTimes(0);
  });

  test('configureDevConfigDir: does not copy credentials if already exists in dev dir', () => {
    process.env.CLAUDE_CODE_DEV_CONFIG_DIR = '/custom/dev/dir';

    mockExistsSync.mockImplementation((p: unknown) => {
      return typeof p === 'string' && p === '/custom/dev/dir/.credentials.json';
    });

    configureDevConfigDir();
    expect(mockMkdirSync).toHaveBeenCalledWith('/custom/dev/dir', { recursive: true });
    expect(mockWriteFileSync).toHaveBeenCalledTimes(0);
  });

  test('installRuntimeGlobals: uses environment variables for MACRO initialization', () => {
    process.env.CLAUDE_CODE_DEV_VERSION = 'test-version';
    process.env.CLAUDE_CODE_DEV_BUILD_TIME = 'test-build-time';
    process.env.CLAUDE_CODE_NATIVE_PACKAGE_URL = 'test-native-url';
    process.env.CLAUDE_CODE_DEV_CHANGELOG = 'test-changelog';

    installRuntimeGlobals();

    expect((globalThis as any).MACRO.VERSION).toBe('test-version');
    expect((globalThis as any).MACRO.BUILD_TIME).toBe('test-build-time');
    expect((globalThis as any).MACRO.NATIVE_PACKAGE_URL).toBe('test-native-url');
    expect((globalThis as any).MACRO.VERSION_CHANGELOG).toBe('test-changelog');
  });

  test('installRuntimeGlobals: merges with existing globalThis.MACRO', () => {
    (globalThis as any).MACRO = { existingKey: 'test' };
    process.env.CLAUDE_CONFIG_DIR = 'existing';

    installRuntimeGlobals();

    expect((globalThis as any).MACRO.existingKey).toBe('test');
    expect((globalThis as any).MACRO.PACKAGE_URL).toBe('@anthropic-ai/claude-code');
  });
});
