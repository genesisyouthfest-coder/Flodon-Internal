import { Resend } from 'resend'
import { log } from '../utils/logger.js'

let cachedConfig = null
let cacheExpiry = 0
const CACHE_TTL = 5 * 60 * 1000

async function getResendConfig() {
  if (cachedConfig && Date.now() < cacheExpiry) return cachedConfig

  try {
    const { supabase } = await import('../supabase.js')
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['resend_api_key', 'resend_from_email'])

    if (!error && data?.length) {
      const map = {}
      data.forEach(row => { map[row.key] = row.value })

      if (map.resend_api_key) {
        cachedConfig = {
          apiKey: map.resend_api_key,
          from: map.resend_from_email || 'Sanskar at FLODON <hello@flodon.in>',
          source: 'database',
        }
        cacheExpiry = Date.now() + CACHE_TTL
        log('[Resend] Config loaded from database')
        return cachedConfig
      }
    }
  } catch (err) {
    log(`[Resend] DB config fetch failed, using env fallback: ${err.message}`, 'warning')
  }

  cachedConfig = {
    apiKey: process.env.RESEND_API_KEY || '',
    from: process.env.RESEND_FROM_EMAIL || 'Sanskar at FLODON <hello@flodon.in>',
    source: 'environment',
  }
  cacheExpiry = Date.now() + CACHE_TTL
  return cachedConfig
}

export function clearResendConfigCache() {
  cachedConfig = null
  cacheExpiry = 0
  log('[Resend] Config cache cleared')
}

let resendClient = null
let resendClientKey = null

async function getResendClient() {
  const config = await getResendConfig()
  if (!config.apiKey) {
    log('[Resend] API key not configured', 'warning')
    return null
  }
  if (!resendClient || resendClientKey !== config.apiKey) {
    resendClient = new Resend(config.apiKey)
    resendClientKey = config.apiKey
  }
  return { client: resendClient, from: config.from }
}

/**
 * Sends an email via Resend API.
 */
export async function sendResendEmail({ to, subject, html }) {
  const resend = await getResendClient()
  if (!resend) return { success: false, error: 'Resend API key not configured' }

  const toList = Array.isArray(to) ? to : [to]

  try {
    const { data, error } = await resend.client.emails.send({
      from: resend.from,
      to: toList,
      subject,
      html,
    })

    if (error) {
      log(`[Resend] Failed to send to [${toList.join(', ')}]: ${error.message}`, 'error')
      return { success: false, error: error.message }
    }

    log(`[Resend] Sent to [${toList.join(', ')}] — Message ID: ${data.id}`)
    return { success: true, messageId: data.id }
  } catch (err) {
    log(`[Resend] Failed to send to [${toList.join(', ')}]: ${err.message}`, 'error')
    return { success: false, error: err.message }
  }
}
