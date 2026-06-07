const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 }
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const sensitive = ['password', 'secret', 'token', 'key', 'auth', 'credential']
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

export function structuredLog(level, message, meta = {}) {
  if (LOG_LEVELS[level] === undefined || LOG_LEVELS[level] > CURRENT_LEVEL) return

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitize(meta),
    environment: process.env.NODE_ENV || 'development',
    service: 'flodon-internal',
  }

  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }

  return entry
}

export const slog = {
  error: (msg, meta) => structuredLog('error', msg, meta),
  warn: (msg, meta) => structuredLog('warn', msg, meta),
  info: (msg, meta) => structuredLog('info', msg, meta),
  debug: (msg, meta) => structuredLog('debug', msg, meta),
}
