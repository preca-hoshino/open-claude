import { afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';

// Mock dependencies
const mockFeature = mock(() => true);
mock.module('bun:bundle', () => ({
  feature: mockFeature,
}));

const mockGetFeatureValue = mock(() => false);
mock.module('../../services/analytics/growthbook.js', () => ({
  // biome-ignore lint/style/useNamingConvention: matches original
  getFeatureValue_CACHED_MAY_BE_STALE: mockGetFeatureValue,
}));

const mockGetClaudeAuth = mock(() => ({ accessToken: 'token' }));
const mockIsAnthropicAuthEnabled = mock(() => true);
mock.module('../../utils/auth.js', () => ({
  // biome-ignore lint/style/useNamingConvention: matches original
  getClaudeAIOAuthTokens: mockGetClaudeAuth,
  isAnthropicAuthEnabled: mockIsAnthropicAuthEnabled,
}));

// Import after mocks are set up
let hasVoiceAuth: () => boolean;
let isVoiceGrowthBookEnabled: () => boolean;
let isVoiceModeEnabled: () => boolean;

describe('voiceModeEnabled', () => {
  beforeAll(async () => {
    const mod = await import('../voiceModeEnabled');
    hasVoiceAuth = mod.hasVoiceAuth;
    isVoiceGrowthBookEnabled = mod.isVoiceGrowthBookEnabled;
    isVoiceModeEnabled = mod.isVoiceModeEnabled;
  });

  afterEach(() => {
    mockFeature.mockClear();
    mockGetFeatureValue.mockClear();
    mockGetClaudeAuth.mockClear();
    mockIsAnthropicAuthEnabled.mockClear();
  });

  describe('isVoiceGrowthBookEnabled', () => {
    it('should return false because VOICE_MODE is statically evaluated to false in tests', () => {
      // feature('VOICE_MODE') evaluates to false statically, so this evaluates to false
      expect(isVoiceGrowthBookEnabled()).toBe(false);
    });
  });

  describe('hasVoiceAuth', () => {
    it('should return false if anthropic auth is not enabled', () => {
      mockIsAnthropicAuthEnabled.mockReturnValue(false);
      expect(hasVoiceAuth()).toBe(false);
    });

    it('should return false if anthropic auth is enabled but no accessToken is present', () => {
      mockIsAnthropicAuthEnabled.mockReturnValue(true);
      mockGetClaudeAuth.mockReturnValue({ accessToken: '' });
      expect(hasVoiceAuth()).toBe(false);

      mockGetClaudeAuth.mockReturnValue(null as never);
      expect(hasVoiceAuth()).toBe(false);
    });

    it('should return true if anthropic auth is enabled and accessToken is present', () => {
      mockIsAnthropicAuthEnabled.mockReturnValue(true);
      mockGetClaudeAuth.mockReturnValue({ accessToken: 'valid_token' });
      expect(hasVoiceAuth()).toBe(true);
    });
  });

  describe('isVoiceModeEnabled', () => {
    it('should return false when auth is missing', () => {
      mockIsAnthropicAuthEnabled.mockReturnValue(false);
      // isVoiceGrowthBookEnabled will be false regardless
      expect(isVoiceModeEnabled()).toBe(false);
    });

    it('should return false even when auth is present because growthbook is statically disabled', () => {
      mockIsAnthropicAuthEnabled.mockReturnValue(true);
      mockGetClaudeAuth.mockReturnValue({ accessToken: 'token' });
      // isVoiceGrowthBookEnabled is statically false, so this expects false
      expect(isVoiceModeEnabled()).toBe(false);
    });
  });
});
