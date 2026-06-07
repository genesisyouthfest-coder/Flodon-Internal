import { describe, it, expect } from 'vitest'

describe('Config', () => {
  it('should have MILESTONES defined', async () => {
    const { MILESTONES } = await import('../config.js')
    expect(MILESTONES).toBeDefined()
    expect(Array.isArray(MILESTONES)).toBe(true)
    expect(MILESTONES.length).toBeGreaterThan(0)
  })

  it('should have VENTURES defined', async () => {
    const { VENTURES } = await import('../config.js')
    expect(VENTURES).toContain('FLODON')
    expect(VENTURES).toContain('SYNTHORY')
  })

  it('should have PLATFORMS defined', async () => {
    const { PLATFORMS } = await import('../config.js')
    expect(PLATFORMS).toContain('linkedin')
    expect(PLATFORMS).toContain('email')
  })

  it('should have CALL_SOURCES defined', async () => {
    const { CALL_SOURCES } = await import('../config.js')
    expect(CALL_SOURCES).toContain('cal.com')
  })

  it('should have PAYMENT_PROVIDERS defined', async () => {
    const { PAYMENT_PROVIDERS } = await import('../config.js')
    expect(PAYMENT_PROVIDERS).toContain('stripe')
  })
})
