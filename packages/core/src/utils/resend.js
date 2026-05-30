import nodemailer from 'nodemailer'
import { log } from './logger.js'
import { sendWhatsAppMessage } from './whatsapp.js'

const SOFTWARE_DASHBOARD_URL = process.env.SOFTWARE_PUBLIC_URL || 'https://internal.flodon.in'

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
    const phone = payload.phone || payload.phone_number || ''
    const date = payload.date || 'N/A'
    const startTime = payload.startTime || 'N/A'
    const website = payload.website || 'N/A'
    const q = payload.biggestBottleneck ? payload : (payload.qualification || {})
    
    // Qualification threshold check
    const revenue = q.monthlyRevenue || ''
    // Assuming "< $5k" or similar strings mean unqualified for main pipeline
    const isUnqualified = revenue.includes('<') || revenue.includes('0-') || revenue.toLowerCase().includes('just starting')
    
    if (clientEmail) {
      if (isUnqualified) {
        // Auto-Cancel & Down-sell / Referral
        const downsellHtml = `
          <div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
            <h2>Strategy Session Update</h2>
            <p>Hi <strong>${clientName}</strong>,</p>
            <p>Thank you for applying. Based on your current revenue stage, our core systems package might not be the most cost-effective fit right now.</p>
            <p>However, we have an exclusive low-ticket workshop designed exactly for your stage to help you scale up to the threshold, or we can refer you to a trusted partner agency.</p>
            <p><a href="https://flodon.in/workshop">Check out the Workshop here</a></p>
            <p>We've cancelled the current call to respect your time, but we will keep you updated with valuable resources in our weekly newsletter!</p>
          </div>
        `
        await sendEmail({ to: clientEmail, subject: `Flodon Strategy Session Update`, html: downsellHtml })
        
        if (phone) {
          await sendWhatsAppMessage({ 
            to: phone, 
            body: `Hi ${clientName}, thank you for booking! Based on your application, our core service isn't the best fit yet. We've cancelled the call, but check your email for a special workshop invite designed for your stage!` 
          })
        }
      } else {
        // Qualified -> Confirmation Link
        const confirmUrl = `${SOFTWARE_DASHBOARD_URL}/api/confirm?email=${encodeURIComponent(clientEmail)}`
        const clientHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #1c1917; line-height: 1.6;">
            <h2 style="font-size: 24px; font-weight: 700; color: #0c0a09; margin-bottom: 20px;">Please Confirm Your Strategy Audit</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${clientName}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Your Discovery Session is tentatively scheduled for ${date} at ${startTime} IST.</p>
            
            <h3 style="font-size: 16px; font-weight: 600; color: #0c0a09; margin-top: 25px; margin-bottom: 10px;">⚠️ Action Required:</h3>
            <p style="font-size: 15px; margin-bottom: 20px;">Please click the button below to confirm your attendance. Unconfirmed calls will be auto-cancelled.</p>
            <p style="margin: 25px 0;">
              <a href="${confirmUrl}" style="background-color: #0c0a09; color: #fafaf9; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Confirm My Call</a>
            </p>
          </div>
        `
        await sendEmail({ to: clientEmail, subject: `Action Required: Confirm Flodon Session | ${clientName}`, html: clientHtml })
        
        if (phone) {
          await sendWhatsAppMessage({ 
            to: phone, 
            body: `Hi ${clientName}, your Flodon strategy session on ${date} is on hold. Please confirm your attendance here: ${confirmUrl}` 
          })
        }
      }
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
            <a href="${SOFTWARE_DASHBOARD_URL}" style="background-color: #0c0a09; color: #fafaf9; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; margin-right: 10px;">🖥️ Dashboard</a>
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
            <a href="${SOFTWARE_DASHBOARD_URL}" style="background-color: #0c0a09; color: #fafaf9; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; margin-right: 10px;">🖥️ Dashboard</a>
            <a href="https://flodon.in/ops" style="background-color: #44403c; color: #fafaf9; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">💼 Ops Portal</a>
          </div>
        </div>
      `
      await sendEmail({ to: adminEmail, subject: `🛑 [Cancelled] ${clientName}`, html: adminCancelHtml })
    }
  }
}

/**
 * Persists Cal.com / website webhook leads and cancellations to Supabase.
 */
export async function handleWebhookDBUpdates(endpoint, payload) {
  const { supabase } = await import('../supabase.js')

  const q = payload.biggestBottleneck ? payload : (payload.qualification || {})
  const name = payload.name || 'Valued Client'
  const email = payload.email
  const phone = payload.phone || payload.phone_number || 'N/A'
  const website = payload.website || q.website || payload.source_url || 'N/A'

  const date = payload.date || payload.booked_date || 'N/A'
  const start = payload.startTime || payload.booked_start || payload.start_time || 'N/A'
  const end = payload.endTime || payload.booked_end || payload.end_time || ''

  // Merge booking info into qualification JSONB
  const qualification = {
    ...q,
    booked_date: date,
    booked_start: start,
    booked_end: end
  }

  if (endpoint === 'lead') {
    if (!email) {
      log('[Webhook DB] Cannot save lead: Email is required.', 'error')
      return { success: false, error: 'Email is required' }
    }

    const revenue = q.monthlyRevenue || ''
    const isUnqualified = revenue.includes('<') || revenue.includes('0-') || revenue.toLowerCase().includes('just starting')
    const initialStage = isUnqualified ? 'nurture' : 'call_booked'
    const isNurture = isUnqualified

    // 1. Check if client exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    let client = null
    if (existingClient) {
      // Update existing client
      const { data, error } = await supabase
        .from('clients')
        .update({
          name,
          phone,
          source_url: website,
          pipeline_stage: initialStage,
          is_nurture: isNurture,
          qualification,
          notes: q.biggestBottleneck || null
        })
        .eq('id', existingClient.id)
        .select()
        .single()

      if (error) {
        log(`[Webhook DB] Failed to update client: ${error.message}`, 'error')
        throw error
      }
      client = data
      log(`[Webhook DB] Updated existing client (id=${client.id})`)
    } else {
      // Get admin profile name
      const adminId = '00000000-0000-0000-0000-000000000001'
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', adminId)
        .maybeSingle()
      const addedByName = adminProfile?.full_name || 'CRM Admin'
      const service = payload.service || q.service || payload.eventTitle || 'General'

      // Create new client
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name,
          email,
          phone,
          source_url: website,
          pipeline_stage: initialStage,
          is_nurture: isNurture,
          lead_source: q.leadSources || q.leadSource || 'website',
          qualification,
          notes: q.biggestBottleneck || null,
          added_by: adminId,
          added_by_name: addedByName,
          service: service
        })
        .select()
        .single()

      if (error) {
        log(`[Webhook DB] Failed to create client: ${error.message}`, 'error')
        throw error
      }
      client = data
      log(`[Webhook DB] Created new client (id=${client.id})`)
    }

    // 2. Insert call
    let scheduledAt = null
    if (date !== 'N/A' && start !== 'N/A') {
      try {
        scheduledAt = new Date(`${date}T${start}`).toISOString()
      } catch {
        scheduledAt = new Date().toISOString()
      }
    } else {
      scheduledAt = new Date().toISOString()
    }

    const { data: call, error: callError } = await supabase
      .from('calls')
      .insert({
        client_id: client.id,
        prospect_name: name,
        company: q.company || null,
        status: 'booked',
        source: 'website',
        scheduled_at: scheduledAt,
      })
      .select()
      .single()

    if (callError) {
      log(`[Webhook DB] Failed to insert call: ${callError.message}`, 'error')
    } else {
      log(`[Webhook DB] Inserted call (id=${call.id})`)
    }

    // 3. Log Activity
    const { error: actError } = await supabase
      .from('activity_log')
      .insert({
        action: 'client_created',
        entity_type: 'client',
        entity_id: client.id,
        metadata: { name, source: 'website' },
        profile_id: '00000000-0000-0000-0000-000000000001'
      })

    if (actError) {
      log(`[Webhook DB] Failed to log activity: ${actError.message}`, 'error')
    }

    return { success: true, clientId: client.id }
  }

  if (endpoint === 'cancel') {
    if (!email) {
      log('[Webhook DB] Cannot cancel call: Email is required.', 'error')
      return { success: false, error: 'Email is required' }
    }

    // Find client
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (client) {
      // Update client stage to 'lost'
      await supabase
        .from('clients')
        .update({
          pipeline_stage: 'lost'
        })
        .eq('id', client.id)

      // Update call status
      const { error: callUpdateError } = await supabase
        .from('calls')
        .update({
          status: 'cancelled',
          outcome: payload.reason || 'Cancelled via webhook'
        })
        .eq('client_id', client.id)
        .eq('status', 'booked')

      if (callUpdateError) {
        log(`[Webhook DB] Failed to cancel calls: ${callUpdateError.message}`, 'error')
      }

      // Log Activity
      await supabase
        .from('activity_log')
        .insert({
          action: 'stage_changed',
          entity_type: 'client',
          entity_id: client.id,
          metadata: { from: 'call_booked', to: 'lost', reason: payload.reason || 'Cancelled' },
          profile_id: '00000000-0000-0000-0000-000000000001'
        })

      log(`[Webhook DB] Processed cancellation for client (id=${client.id})`)
      return { success: true, clientId: client.id }
    } else {
      log(`[Webhook DB] Cancellation received but no client found for email ${email}`, 'warning')
      return { success: false, error: 'Client not found' }
    }
  }

  return { success: false, error: 'Invalid endpoint' }
}

export async function sendRebookingEmail(clientEmail, phone, clientName) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
      <h2>Rebook Your Strategy Session</h2>
      <p>Hi <strong>${clientName}</strong>,</p>
      <p>We saw that you cancelled your upcoming Flodon Discovery Session.</p>
      <p>If this was just a scheduling conflict, we'd love to find a better time for you.</p>
      <p><a href="https://flodon.in/book-a-call">Click here to rebook your session</a></p>
    </div>
  `
  await sendEmail({ to: clientEmail, subject: `Rebook your Flodon Strategy Session`, html })
  
  if (phone) {
    await sendWhatsAppMessage({ 
      to: phone, 
      body: `Hi ${clientName}, saw you had to cancel our session. If you're still interested, let's find a better time: https://flodon.in/book-a-call` 
    })
  }
}

export async function sendNoShowEmail(clientEmail, phone, clientName) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
      <h2>Missed You on the Call</h2>
      <p>Hi <strong>${clientName}</strong>,</p>
      <p>We missed you on our scheduled strategy session today.</p>
      <p>If you'd like to reschedule, you can do so here:</p>
      <p><a href="https://flodon.in/book-a-call">Reschedule your session</a></p>
    </div>
  `
  await sendEmail({ to: clientEmail, subject: `Missed You - Flodon Strategy Session`, html })
  
  if (phone) {
    await sendWhatsAppMessage({ 
      to: phone, 
      body: `Hi ${clientName}, looks like we missed each other today. Let me know if you want to reschedule: https://flodon.in/book-a-call` 
    })
  }
}

export async function sendLongTermNurtureEmail(clientEmail, phone, clientName) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
      <h2>System Architectures that Scale</h2>
      <p>Hi <strong>${clientName}</strong>,</p>
      <p>This week, we're looking at how top agencies automate their client onboarding flows using webhooks and custom CRMs, cutting out 15+ hours of manual work per week.</p>
      <p>Check out our latest deep dive here:</p>
      <p><a href="https://flodon.in/blog">Read the full breakdown</a></p>
      <p>Whenever you're ready to implement this in your business, we're here.</p>
    </div>
  `
  await sendEmail({ to: clientEmail, subject: `Scale your agency with this workflow`, html })
  
  if (phone) {
    await sendWhatsAppMessage({ 
      to: phone, 
      body: `Hi ${clientName}, new value drop from Flodon! We just broke down how top agencies automate onboarding. Check it out: https://flodon.in/blog` 
    })
  }
}

export async function sendOnboardingEmail(clientEmail, phone, clientName, dealTitle) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
      <h2>Welcome to Flodon!</h2>
      <p>Hi <strong>${clientName}</strong>,</p>
      <p>We're thrilled to partner with you on <strong>${dealTitle}</strong>.</p>
      <p>Your dedicated slack channel has been set up, and we'll be kicking off your 30-Day Rolling Retainer immediately.</p>
      <p>Let's build something incredible together.</p>
    </div>
  `
  await sendEmail({ to: clientEmail, subject: `Welcome to Flodon!`, html })
  
  if (phone) {
    await sendWhatsAppMessage({ 
      to: phone, 
      body: `Welcome to Flodon, ${clientName}! We're thrilled to start building ${dealTitle}. Check your email for next steps!` 
    })
  }
}


