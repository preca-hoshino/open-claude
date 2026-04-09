import { describe, it, expect } from 'bun:test'
import { productionDeps } from '../deps.js'
import { queryModelWithStreaming } from '../../services/api/claude.js'
import { autoCompactIfNeeded } from '../../services/compact/autoCompact.js'
import { microcompactMessages } from '../../services/compact/microCompact.js'

describe('productionDeps', () => {
  it('should return the correct production dependencies', () => {
    const deps = productionDeps()
    
    expect(deps.callModel).toBe(queryModelWithStreaming)
    expect(deps.microcompact).toBe(microcompactMessages)
    expect(deps.autocompact).toBe(autoCompactIfNeeded)
    expect(typeof deps.uuid).toBe('function')
    
    const id = deps.uuid()
    expect(typeof id).toBe('string')
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })
})
