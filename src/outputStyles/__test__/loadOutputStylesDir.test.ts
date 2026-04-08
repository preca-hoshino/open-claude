import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { basename } from 'path';

// Mock dependencies
const mockLoadMarkdownFilesForSubdir = mock();
const mockExtractDescriptionFromMarkdown = mock();
const mockCoerceDescriptionToString = mock();
const mockLogForDebugging = mock();
const mockLogError = mock();
const mockClearPluginOutputStyleCache = mock();

mock.module('../../utils/markdownConfigLoader.js', () => ({
  loadMarkdownFilesForSubdir: mockLoadMarkdownFilesForSubdir,
  extractDescriptionFromMarkdown: mockExtractDescriptionFromMarkdown,
}));

mock.module('../../utils/frontmatterParser.js', () => ({
  coerceDescriptionToString: mockCoerceDescriptionToString,
}));

mock.module('../../utils/debug.js', () => ({
  logForDebugging: mockLogForDebugging,
}));

mock.module('../../utils/log.js', () => ({
  logError: mockLogError,
}));

mock.module('../../utils/plugins/loadPluginOutputStyles.js', () => ({
  clearPluginOutputStyleCache: mockClearPluginOutputStyleCache,
}));

// Now import the module to test
import { getOutputStyleDirStyles, clearOutputStyleCaches } from '../loadOutputStylesDir';

describe('loadOutputStylesDir', () => {
  beforeEach(() => {
    mockLoadMarkdownFilesForSubdir.mockReset();
    mockExtractDescriptionFromMarkdown.mockReset();
    mockCoerceDescriptionToString.mockReset();
    mockLogForDebugging.mockReset();
    mockLogError.mockReset();
    mockClearPluginOutputStyleCache.mockReset();
    clearOutputStyleCaches();
  });

  describe('getOutputStyleDirStyles', () => {
    it('should load output styles successfully', async () => {
      const mockFiles = [
        {
          filePath: 'path/to/style1.md',
          frontmatter: { name: 'Style 1', description: 'Desc 1', 'keep-coding-instructions': true },
          content: 'Prompt 1',
          source: 'project' as const,
        },
        {
          filePath: 'path/to/style2.md',
          frontmatter: {},
          content: 'Prompt 2',
          source: 'user' as const,
        },
      ];

      mockLoadMarkdownFilesForSubdir.mockResolvedValue(mockFiles);
      mockCoerceDescriptionToString.mockImplementation((val: any) => val);
      mockExtractDescriptionFromMarkdown.mockReturnValue('Extracted Description');

      const styles = await getOutputStyleDirStyles('cwd');

      expect(styles).toHaveLength(2);
      expect(styles[0]).toEqual({
        name: 'Style 1',
        description: 'Desc 1',
        prompt: 'Prompt 1',
        source: 'project',
        keepCodingInstructions: true,
      });
      expect(styles[1]).toEqual({
        name: 'style2',
        description: 'Extracted Description',
        prompt: 'Prompt 2',
        source: 'user',
        keepCodingInstructions: undefined,
      });

      expect(mockLoadMarkdownFilesForSubdir).toHaveBeenCalledWith('output-styles', 'cwd');
    });

    it('should handle keep-coding-instructions variations', async () => {
      const mockFiles = [
        {
          filePath: 't1.md',
          frontmatter: { 'keep-coding-instructions': 'true' },
          content: 'c',
          source: 'project' as const,
        },
        {
          filePath: 't2.md',
          frontmatter: { 'keep-coding-instructions': false },
          content: 'c',
          source: 'project' as const,
        },
        {
          filePath: 't3.md',
          frontmatter: { 'keep-coding-instructions': 'false' },
          content: 'c',
          source: 'project' as const,
        },
      ];

      mockLoadMarkdownFilesForSubdir.mockResolvedValue(mockFiles);
      mockCoerceDescriptionToString.mockImplementation((val: any) => val);

      const styles = await getOutputStyleDirStyles('cwd');

      expect(styles[0].keepCodingInstructions).toBe(true);
      expect(styles[1].keepCodingInstructions).toBe(false);
      expect(styles[2].keepCodingInstructions).toBe(false);
    });

    it('should warn when force-for-plugin is set', async () => {
      const mockFiles = [
        {
          filePath: 'style.md',
          frontmatter: { 'force-for-plugin': true },
          content: 'c',
          source: 'project' as const,
        },
      ];

      mockLoadMarkdownFilesForSubdir.mockResolvedValue(mockFiles);
      mockCoerceDescriptionToString.mockImplementation((val: any) => val);

      await getOutputStyleDirStyles('cwd');

      expect(mockLogForDebugging).toHaveBeenCalledWith(
        expect.stringContaining('has force-for-plugin set'),
        { level: 'warn' }
      );
    });

    it('should handle errors in individual styles and skip them', async () => {
      const mockFiles = [
        {
          filePath: 'valid.md',
          frontmatter: { name: 'Valid' },
          content: 'c',
          source: 'project' as const,
        },
        {
          filePath: 'invalid.md',
          frontmatter: null as any, // This will trigger error in basename(filePath) or frontmatter access
          content: 'c',
          source: 'project' as const,
        },
      ];

      mockLoadMarkdownFilesForSubdir.mockResolvedValue(mockFiles);
      
      // We need to trigger an error inside the map's try-catch
      // Let's make basename throw or something. Actually, frontmatter is null, so frontmatter['name'] will throw.
      
      const styles = await getOutputStyleDirStyles('cwd');

      expect(styles).toHaveLength(1);
      expect(styles[0].name).toBe('Valid');
      expect(mockLogError).toHaveBeenCalled();
    });

    it('should return empty array and log error when loadMarkdownFilesForSubdir throws', async () => {
      mockLoadMarkdownFilesForSubdir.mockRejectedValue(new Error('Load failed'));

      const styles = await getOutputStyleDirStyles('cwd');

      expect(styles).toEqual([]);
      expect(mockLogError).toHaveBeenCalled();
    });

    it('should use cache and return memoized results', async () => {
      mockLoadMarkdownFilesForSubdir.mockResolvedValue([]);

      await getOutputStyleDirStyles('cwd');
      await getOutputStyleDirStyles('cwd');

      expect(mockLoadMarkdownFilesForSubdir).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearOutputStyleCaches', () => {
    it('should clear all caches', () => {
      clearOutputStyleCaches();
      expect(mockClearPluginOutputStyleCache).toHaveBeenCalled();
    });
  });
});
