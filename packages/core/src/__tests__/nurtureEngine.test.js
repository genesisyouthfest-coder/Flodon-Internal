import { describe, it, expect } from 'vitest'

describe('Nurture Engine', () => {
  it('should export all functions', async () => {
    const mod = await import('../lib/nurtureEngine.js')
    expect(mod.createNurtureSequence).toBeDefined()
    expect(mod.subscribeToNurture).toBeDefined()
    expect(mod.unsubscribeFromNurture).toBeDefined()
    expect(mod.processNurtureQueue).toBeDefined()
    expect(mod.listNurtureSequences).toBeDefined()
    expect(mod.getClientNurtureStatus).toBeDefined()
  })
})
