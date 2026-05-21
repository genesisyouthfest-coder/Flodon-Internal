const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

export function log(message, level = 'info') {
  const time = new Date().toLocaleTimeString('en-IN', { hour12: false })
  const prefix = {
    info:  `${COLORS.cyan}[INFO]${COLORS.reset}`,
    warn:  `${COLORS.yellow}[WARN]${COLORS.reset}`,
    warning: `${COLORS.yellow}[WARN]${COLORS.reset}`,
    error: `${COLORS.red}[ERROR]${COLORS.reset}`,
    ok:    `${COLORS.green}[OK]${COLORS.reset}`,
  }[level] || `[LOG]`

  console.log(`${prefix} ${time} — ${message}`)
}
