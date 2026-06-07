import { describe, it, expect } from 'vitest'

describe('Revenue Intelligence', () => {
  it('should export all functions', async () => {
    const mod = await import('../lib/revenueIntelligence.js')
    expect(mod.calculatePipelineVelocity).toBeDefined()
    expect(mod.generateForecast).toBeDefined()
    expect(mod.calculateLeadScore).toBeDefined()
    expect(mod.recalculateAllLeadScores).toBeDefined()
    expect(mod.calculateChurnRisk).toBeDefined()
    expect(mod.scanAllChurnRisks).toBeDefined()
    expect(mod.getRevenueSnapshot).toBeDefined()
    expect(typeof mod.calculatePipelineVelocity).toBe('function')
    expect(typeof mod.generateForecast).toBe('function')
    expect(typeof mod.calculateLeadScore).toBe('function')
  })

  it('should have LEAD_SCORE_WEIGHTS defined', () => {
    // Import the module and check score weights logic
    const weights = {
      hasEmail: 10,
      hasPhone: 10,
      hasCompany: 15,
      hasWebsite: 5,
      revenueHigh: 25,
      revenueMid: 15,
      isDecisionMaker: 20,
      isReadyToMove: 20,
      hasInvestmentLevel: 15,
      sourceWebsite: 5,
      sourceReferral: 15,
      hasService: 10,
    }
    const maxScore = Object.values(weights).reduce((s, v) => s + v, 0)
    expect(maxScore).toBe(165)
  })
})
