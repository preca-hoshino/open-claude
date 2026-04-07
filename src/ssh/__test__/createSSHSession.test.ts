// biome-ignore lint/style/useFilenamingConvention: test file matches original source filename
import { describe, expect, it } from 'bun:test';
import { SSHSessionError, createLocalSSHSession, createSSHSession } from '../createSSHSession';

describe('createSSHSession module', () => {
  describe('SSHSessionError', () => {
    it('should create an error with the correct name and message', () => {
      const error = new SSHSessionError('test error');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SSHSessionError');
      expect(error.message).toBe('test error');
    });
  });

  describe('createSSHSession', () => {
    it('should throw SSHSessionError', async () => {
      await expect(createSSHSession('host')).rejects.toThrow(SSHSessionError);
      await expect(createSSHSession('host')).rejects.toThrow('SSH sessions not available in source build');
    });
  });

  describe('createLocalSSHSession', () => {
    it('should throw SSHSessionError', async () => {
      await expect(createLocalSSHSession()).rejects.toThrow(SSHSessionError);
      await expect(createLocalSSHSession()).rejects.toThrow('SSH sessions not available in source build');
    });
  });
});
