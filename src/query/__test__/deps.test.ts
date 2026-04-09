import { describe, expect, it } from 'bun:test';
import { queryModelWithStreaming } from '../../services/api/claude.js';
import { autoCompactIfNeeded } from '../../services/compact/autoCompact.js';
import { microcompactMessages } from '../../services/compact/microCompact.js';
import { productionDeps } from '../deps.js';

describe('productionDeps', () => {
  it('should return the correct production dependencies', () => {
    const deps = productionDeps();

    expect(deps.callModel).toBe(queryModelWithStreaming);
    expect(deps.microcompact).toBe(microcompactMessages);
    expect(deps.autocompact).toBe(autoCompactIfNeeded);
    expect(typeof deps.uuid).toBe('function');

    const id = deps.uuid();
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
