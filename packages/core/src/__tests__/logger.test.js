import { describe, it, expect, vi } from 'vitest'

describe('Logger', () => {
  it('should export log function', async () => {
    const { log } = await import('../utils/logger.js')
    expect(log).toBeDefined()
    expect(typeof log).toBe('function')
  })

  it('should log without throwing', async () => {
    const { log } = await import('../utils/logger.js')
    expect(() => log('test message', 'info')).not.toThrow()
    expect(() => log('test warning', 'warn')).not.toThrow()
    expect(() => log('test error', 'error')).not.toThrow()
    expect(() => log('test ok', 'ok')).not.toThrow()
  })
})
