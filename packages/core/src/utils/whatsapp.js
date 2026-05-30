import { log } from './logger.js'

let cachedConfig = null
let cacheExpiry = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches WhatsApp config from Supabase `settings` table.
 * Falls back to environment variables if DB is unavailable.
 */
async function getWhatsAppConfig() {
  if (cachedConfig && Date.now() < cacheExpiry) return cachedConfig

  try {
    const { supabase } = await import('../supabase.js')
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['twilio_account_sid', 'twilio_auth_token', 'twilio_whatsapp_number'])

    if (!error && data && data.length > 0) {
      const map = {}
      data.forEach(row => { map[row.key] = row.value })

      if (map.twilio_account_sid && map.twilio_auth_token) {
        cachedConfig = {
          accountSid: map.twilio_account_sid,
          authToken: map.twilio_auth_token,
          fromNumber: map.twilio_whatsapp_number || '',
          source: 'database',
        }
        cacheExpiry = Date.now() + CACHE_TTL
        return cachedConfig
      }
    }
  } catch (err) {
    log(`[WhatsApp] DB config fetch failed, using env fallback: ${err.message}`, 'warning')
  }

  // Fallback
  cachedConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
    source: 'environment',
  }
  cacheExpiry = Date.now() + CACHE_TTL
  return cachedConfig
}

export function clearWhatsAppConfigCache() {
  cachedConfig = null
  cacheExpiry = 0
  log('[WhatsApp] Config cache cleared')
}

/**
 * Sends a WhatsApp message via Twilio API using fetch.
 */
export async function sendWhatsAppMessage({ to, body }) {
  const config = await getWhatsAppConfig()
  
  if (!config.accountSid || !config.authToken) {
    log('[WhatsApp] Skipping: Twilio credentials not configured.', 'warning')
    return { success: false, error: 'Twilio not configured' }
  }

  // Ensure 'to' has the whatsapp: prefix and country code.
  // Assumes Indian numbers if no '+' prefix exists for simplicity (extend as needed).
  let formattedTo = to.replace(/[^0-9+]/g, '')
  if (!formattedTo.startsWith('+')) {
    formattedTo = '+91' + formattedTo
  }
  
  const toParam = `whatsapp:${formattedTo}`
  let fromParam = config.fromNumber
  if (!fromParam.startsWith('whatsapp:')) {
    fromParam = `whatsapp:${fromParam}`
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`
  const basicAuth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')

  const params = new URLSearchParams()
  params.append('To', toParam)
  params.append('From', fromParam)
  params.append('Body', body)

  try {
    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    const data = await res.json()
    if (res.ok) {
      log(`[WhatsApp] Sent message to [${toParam}] — SID: ${data.sid}`)
      return { success: true, sid: data.sid }
    } else {
      log(`[WhatsApp] Failed to send to [${toParam}]: ${data.message}`, 'error')
      return { success: false, error: data.message }
    }
  } catch (error) {
    log(`[WhatsApp] Request failed: ${error.message}`, 'error')
    return { success: false, error: error.message }
  }
}
