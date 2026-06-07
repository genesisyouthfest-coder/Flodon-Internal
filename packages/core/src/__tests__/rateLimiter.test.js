import { describe, it, expect } from 'vitest'

describe('Rate Limiter', () => {
  it('should create a rate limiter and enforce limits', async () => {
    const { createRateLimiter } = await import('../lib/rateLimiter.js')
    const limiter = createRateLimiter({ windowMs: 60000, max: 3, name: `test-${Date.now()}` })

    // First request should be allowed
    const result1 = limiter.middleware('test-key')
    expect(result1.allowed).toBe(true)
    expect(result1.remaining).toBe(2)

    // Second request allowed
    const result2 = limiter.middleware('test-key')
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(1)

    // Third request allowed
    const result3 = limiter.middleware('test-key')
    expect(result3.allowed).toBe(true)
    expect(result3.remaining).toBe(0)

    // Fourth request should be blocked
    const result4 = limiter.middleware('test-key')
    expect(result4.allowed).toBe(false)
    expect(result4.remaining).toBe(0)

    // Different key should be allowed
    const resultOther = limiter.middleware('other-key')
    expect(resultOther.allowed).toBe(true)
    expect(resultOther.remaining).toBe(2)

    clearInterval(limiter.cleanup)
  })

  it('should create rate limit middleware', async () => {
    const { createRateLimitMiddleware } = await import('../lib/rateLimiter.js')
    const middleware = createRateLimitMiddleware({
      windowMs: 60000,
      max: 5,
      name: `test-middleware-${Date.now()}`,
      keyExtractor: (req) => req.ip || 'test',
    })

    const result = middleware({ ip: '127.0.0.1' })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })
})
