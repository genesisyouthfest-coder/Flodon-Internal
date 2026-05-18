import nodemailer from 'nodemailer'
import { log } from './logger.js'

// ─── Dynamic Config: DB-first, env fallback ───
let cachedConfig = null
let cacheExpiry = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches email config from Supabase `settings` table.
 * Falls back to environment variables if DB is unavailable.
 */
async function getEmailConfig() {
  if (cachedConfig && Date.now() < cacheExpiry) return cachedConfig

  try {
    // Dynamic import to avoid circular dependency with supabase.js
    const { supabase } = await import('../supabase.js')
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['gmail_user', 'gmail_app_password', 'gmail_from_name', 'admin_email'])

    if (!error && data && data.length > 0) {
      const map = {}
      data.forEach(row => { map[row.key] = row.value })

      // Only use DB config if the critical fields are populated
      if (map.gmail_user && map.gmail_app_password) {
        cachedConfig = {
          gmailUser: map.gmail_user,
          gmailAppPassword: map.gmail_app_password,
          gmailFromName: map.gmail_from_name || 'Flodon Operations',
          adminEmail: map.admin_email || map.gmail_user,
          source: 'database',
        }
        cacheExpiry = Date.now() + CACHE_TTL
        log('[Email] Config loaded from database')
        return cachedConfig
      }
    }
  } catch (err) {
    log(`[Email] DB config fetch failed, using env fallback: ${err.message}`, 'warning')
  }

  // Fallback to environment variables
  cachedConfig = {
    gmailUser: process.env.GMAIL_USER || '',
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD || '',
    gmailFromName: process.env.GMAIL_FROM_NAME || 'Flodon Operations',
    adminEmail: process.env.ADMIN_EMAIL || process.env.GMAIL_USER || '',
    source: 'environment',
  }
  cacheExpiry = Date.now() + CACHE_TTL
  return cachedConfig
}

/** Bust the config cache (called when settings are updated via dashboard) */
export function clearEmailConfigCache() {
  cachedConfig = null
  cacheExpiry = 0
  transporterInstance = null
  log('[Email] Config cache cleared')
}

// ─── Gmail SMTP Transporter (created lazily) ───
let transporterInstance = null

async function getTransporter() {
  const config = await getEmailConfig()
  if (!config.gmailUser || !config.gmailAppPassword) {
    log('[Email] Skipping: Gmail credentials not configured.', 'warning')
    return null
  }

  // Recreate if config source changed or transporter doesn't exist
  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.gmailUser, pass: config.gmailAppPassword },
    })
    log(`[Email] SMTP transporter ready (${config.gmailUser}) [source: ${config.source}]`)
  }

  return transporterInstance
}

/**
 * Sends an email via Gmail SMTP.
 */
export async function sendEmail({ to, subject, html, from }) {
  const smtp = await getTransporter()
  if (!smtp) return { success: false, error: 'Gmail SMTP not configured' }

  const config = await getEmailConfig()
  const fromAddress = from || `${config.gmailFromName} <${config.gmailUser}>`
  const toList = Array.isArray(to) ? to.join(', ') : to

  try {
    const info = await smtp.sendMail({ from: fromAddress, to: toList, subject, html })
    log(`[Email] Sent to [${toList}] — Message ID: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    log(`[Email] Failed to send to [${toList}]: ${error.message}`, 'error')
    return { success: false, error: error.message }
  }
}

/**
 * Triggers emails automatically for incoming CRM/Cal.com webhooks.
 */
export async function handleWebhookEmails(endpoint, payload) {
  const config = await getEmailConfig()
  const adminEmail = config.adminEmail

  if (endpoint === 'lead') {
    const clientEmail = payload.email
    const clientName = payload.name || 'Valued Client'
    const date = payload.date || 'N/A'
    const startTime = payload.startTime || 'N/A'
    const website = payload.website || 'N/A'

    if (clientEmail) {
      const clientHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #1c1917; line-height: 1.6;">
          <h2 style="font-size: 24px; font-weight: 700; color: #0c0a09; margin-bottom: 20px; letter-spacing: -0.025em;">Your Flodon Strategy Audit is Confirmed</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${clientName}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 20px;">Your Discovery Session is officially scheduled. We're looking forward to auditing your workflows and designing an autonomous system tailored to scale your operations.</p>
          
          <div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin-top: 0; font-size: 16px; font-weight: 600; color: #44403c; margin-bottom: 15px;">Session Details:</h3>
            <p style="margin: 6px 0; font-size: 15px;">🗓️ <strong>Date:</strong> ${date}</p>
            <p style="margin: 6px 0; font-size: 15px;">🕒 <strong>Time:</strong> ${startTime} IST</p>
            <p style="margin: 6px 0; font-size: 15px;">📍 <strong>Platform:</strong> Google Meet (Link attached to your calendar invite)</p>
          </div>
          
          <h3 style="font-size: 16px; font-weight: 600; color: #0c0a09; margin-top: 25px; margin-bottom: 10px;">⚠️ Action Required Before Our Call:</h3>
          <p style="font-size: 15px; margin-bottom: 20px;">Please watch this brief overview of how we engineer operations before our call to ensure we make the most of our session:</p>
          <p style="margin: 25px 0;">
            <a href="https://flodon.in/book-a-call/confirmed?name=${encodeURIComponent(clientName)}" style="background-color: #0c0a09; color: #fafaf9; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Watch System Overview</a>
          </p>
          
          <h3 style="font-size: 16px; font-weight: 600; color: #0c0a09; margin-top: 25px; margin-bottom: 10px;">💡 Preparation Checklist:</h3>
          <ul style="padding-left: 20px; margin-bottom: 30px; font-size: 15px;">
            <li style="margin-bottom: 8px;">Join from a desktop or laptop computer (we will be reviewing system schemas).</li>
            <li style="margin-bottom: 8px;">Ensure you are in a quiet workspace.</li>
            <li style="margin-bottom: 8px;">Have details regarding your primary CRM and operational bottlenecks ready.</li>
          </ul>
          
          <hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 30px 0;" />
          <p style="font-size: 12px; color: #78716c; margin-bottom: 0;">Need to reschedule or cancel? Use the cancellation link in your Google Calendar invite.</p>
        </div>
      `
      await sendEmail({ to: clientEmail, subject: `🚀 Flodon Session Confirmed | ${clientName}`, html: clientHtml })
    }

    if (adminEmail) {
      const q = payload.biggestBottleneck ? payload : (payload.qualification || {})
      const adminHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #1c1917; line-height: 1.6;">
          <h2 style="font-size: 22px; font-weight: 700; color: #0c0a09; margin-bottom: 5px;">⚡ New Discovery Call Booked</h2>
          <p style="color: #78716c; font-size: 15px; margin-top: 0; margin-bottom: 25px;">A new prospect has scheduled a strategy call.</p>
          <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; font-size: 15px; font-weight: 600; color: #44403c; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px; margin-bottom: 15px;">Lead Profile</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c; width: 35%;">Name:</td><td style="color: #0c0a09; font-weight: 600;">${clientName}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Email:</td><td>${clientEmail || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Phone:</td><td>${payload.phone || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Website:</td><td><a href="${website}" style="color: #2563eb;">${website}</a></td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Scheduled:</td><td style="font-weight: 600;">${date} @ ${startTime} IST</td></tr>
            </table>
          </div>
          <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin-top: 0; font-size: 15px; font-weight: 600; color: #44403c; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px; margin-bottom: 15px;">Qualification</h3>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Revenue:</strong> ${payload.monthlyRevenue || q.monthlyRevenue || 'N/A'}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Investment:</strong> ${payload.investmentLevel || q.investmentLevel || 'N/A'}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Ready:</strong> ${payload.readyToImplement || q.readyToImplement || 'N/A'}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Decision Maker:</strong> ${payload.decisionMaker || q.decisionMaker || 'N/A'}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Source:</strong> ${payload.leadSources || q.leadSources || q.leadSource || 'N/A'}</p>
            <p style="font-size: 14px; margin: 12px 0 6px;"><strong>Bottleneck:</strong><br/><em>"${payload.biggestBottleneck || q.biggestBottleneck || 'N/A'}"</em></p>
            <p style="font-size: 14px; margin: 12px 0 6px;"><strong>90-Day Goal:</strong><br/><em>"${payload.ninetyDayGoal || q.ninetyDayGoal || q.goal || 'N/A'}"</em></p>
          </div>
          <div style="text-align: center;">
            <a href="https://flodon-internal-software.onrender.com" style="background-color: #0c0a09; color: #fafaf9; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; margin-right: 10px;">🖥️ Dashboard</a>
            <a href="https://flodon.in/ops" style="background-color: #44403c; color: #fafaf9; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">💼 Ops Portal</a>
          </div>
        </div>
      `
      await sendEmail({ to: adminEmail, subject: `⚡ [New Lead] ${clientName} - ${website}`, html: adminHtml })
    }
  } 
  
  else if (endpoint === 'cancel') {
    const clientEmail = payload.email
    const clientName = payload.name || 'Valued Client'
    const date = payload.date || 'N/A'
    const startTime = payload.startTime || 'N/A'
    const reason = payload.reason || 'Requested by client'

    if (clientEmail) {
      const clientCancelHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #1c1917; line-height: 1.6;">
          <h2 style="font-size: 24px; font-weight: 700; color: #7f1d1d; margin-bottom: 20px;">Session Cancellation Confirmed</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${clientName}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 20px;">Your strategy session scheduled for <strong>${date} at ${startTime} IST</strong> has been cancelled.</p>
          <p style="font-size: 16px; margin-bottom: 20px; font-style: italic; color: #44403c;">Reason: "${reason}"</p>
          <p style="margin: 25px 0;"><a href="https://flodon.in/book-a-call" style="background-color: #0c0a09; color: #fafaf9; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Book A New Slot</a></p>
        </div>
      `
      await sendEmail({ to: clientEmail, subject: `⚠️ Cancelled: Flodon Discovery Session`, html: clientCancelHtml })
    }

    if (adminEmail) {
      const adminCancelHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #1c1917; line-height: 1.6;">
          <h2 style="font-size: 22px; font-weight: 700; color: #7f1d1d; margin-bottom: 20px;">🛑 Call Cancelled Alert</h2>
          <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; font-weight: 600; color: #7f1d1d; width: 35%;">Name:</td><td style="color: #7f1d1d; font-weight: 600;">${clientName}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Email:</td><td>${clientEmail || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Scheduled:</td><td style="font-weight: 600;">${date} @ ${startTime} IST</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Reason:</td><td style="color: #b91c1c; font-style: italic;">"${reason}"</td></tr>
            </table>
          </div>
          <div style="text-align: center;">
            <a href="https://flodon-internal-software.onrender.com" style="background-color: #0c0a09; color: #fafaf9; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; margin-right: 10px;">🖥️ Dashboard</a>
            <a href="https://flodon.in/ops" style="background-color: #44403c; color: #fafaf9; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">💼 Ops Portal</a>
          </div>
        </div>
      `
      await sendEmail({ to: adminEmail, subject: `🛑 [Cancelled] ${clientName}`, html: adminCancelHtml })
    }
  }
}
