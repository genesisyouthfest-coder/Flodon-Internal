const stores = new Map()

export function createRateLimiter({ windowMs = 60000, max = 100, name = 'default' } = {}) {
  if (stores.has(name)) return stores.get(name)

  const store = new Map()

  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now - entry.start > windowMs) {
        store.delete(key)
      }
    }
  }, windowMs * 2)

  if (cleanup.unref) cleanup.unref()

  const middleware = (key) => {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now - entry.start > windowMs) {
      store.set(key, { count: 1, start: now })
      return { allowed: true, remaining: max - 1, resetIn: windowMs }
    }

    entry.count++

    if (entry.count > max) {
      return { allowed: false, remaining: 0, resetIn: windowMs - (now - entry.start) }
    }

    return { allowed: true, remaining: max - entry.count, resetIn: windowMs - (now - entry.start) }
  }

  const instance = { middleware, store, cleanup }
  stores.set(name, instance)
  return instance
}

export function createRateLimitMiddleware({ windowMs = 60000, max = 100, name = 'default', keyExtractor } = {}) {
  const limiter = createRateLimiter({ windowMs, max, name })

  return (req) => {
    const key = keyExtractor ? keyExtractor(req) : req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
    return limiter.middleware(key)
  }
}
