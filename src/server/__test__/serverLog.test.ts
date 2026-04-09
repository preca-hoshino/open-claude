import { describe, expect, it } from 'bun:test';
import { createServerLogger } from '../serverLog.js';

describe('serverLog', () => {
  it('should return a logger with info, error, warn, debug methods', () => {
    const logger = createServerLogger();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');

    // Calling them should not throw
    logger.info('test');
    logger.error('test');
    logger.warn('test');
    logger.debug('test');
  });
});
