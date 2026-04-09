import { describe, expect, it } from 'bun:test';
import { parseConnectUrl } from '../parseConnectUrl.js';

describe('parseConnectUrl', () => {
  it('should return serverUrl and empty authToken', () => {
    const result = parseConnectUrl('http://example.com');
    expect(result).toEqual({ serverUrl: 'http://example.com', authToken: '' });
  });
});
