import { describe, it, expect } from 'vitest'

describe('API Keys', () => {
  it('should export all functions', async () => {
    const mod = await import('../lib/apiKeys.js')
    expect(mod.createApiKey).toBeDefined()
    expect(mod.listApiKeys).toBeDefined()
    expect(mod.revokeApiKey).toBeDefined()
    expect(mod.validateApiKey).toBeDefined()
    expect(typeof mod.createApiKey).toBe('function')
  })
})
