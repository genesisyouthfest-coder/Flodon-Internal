import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'
import { sendResendEmail } from './resend.js'
import { generateOutreachEmail } from './emailGen.js'

const MAX_PER_RUN = 5

let cachedQueueSettings = null
let queueSettingsExpiry = 0
const CACHE_TTL = 5 * 60 * 1000

async function getQueueDelaySettings() {
  if (cachedQueueSettings && Date.now() < queueSettingsExpiry) return cachedQueueSettings

  const defaults = { min: 5, max: 45 }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['email_queue_min_delay_minutes', 'email_queue_max_delay_minutes'])

    if (!error && data?.length) {
      const map = {}
      data.forEach(row => { map[row.key] = row.value })
      cachedQueueSettings = {
        min: parseInt(map.email_queue_min_delay_minutes, 10) || defaults.min,
        max: parseInt(map.email_queue_max_delay_minutes, 10) || defaults.max,
      }
      queueSettingsExpiry = Date.now() + CACHE_TTL
      return cachedQueueSettings
    }
  } catch (err) {
    log(`[EmailQueue] Settings fetch failed: ${err.message}`, 'warning')
  }

  cachedQueueSettings = defaults
  queueSettingsExpiry = Date.now() + CACHE_TTL
  return cachedQueueSettings
}

function randomScheduledAt(minMinutes, maxMinutes) {
  const minMs = minMinutes * 60 * 1000
  const maxMs = maxMinutes * 60 * 1000
  const delay = minMs + Math.floor(Math.random() * (maxMs - minMs + 1))
  return new Date(Date.now() + delay).toISOString()
}

function formatIST(dateStr, timeStr) {
  if (!dateStr) return 'TBD'
  const combined = timeStr ? `${dateStr}T${timeStr}` : dateStr
  try {
    const d = new Date(combined)
    if (Number.isNaN(d.getTime())) return `${dateStr}${timeStr ? ` @ ${timeStr}` : ''} IST`
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' IST'
  } catch {
    return `${dateStr}${timeStr ? ` @ ${timeStr}` : ''} IST`
  }
}

function buildCallBookingHtml({ name, date, startTime, endTime }) {
  const when = formatIST(date, startTime)
  const endNote = endTime ? ` – ${endTime}` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#09090b;padding:28px 32px;">
      <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#a1a1aa;">FLODON</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#fafaf9;letter-spacing:-0.02em;">Your call is confirmed</h1>
    </div>
    <div style="padding:32px;color:#18181b;line-height:1.65;font-size:15px;">
      <p style="margin:0 0 16px;">Hi <strong>${name || 'there'}</strong>,</p>
      <p style="margin:0 0 20px;">Your discovery session with FLODON is locked in. We'll map your workflows and identify where AI calling agents and automation can remove manual bottlenecks.</p>
      <div style="background:#fafaf9;border:1px solid #e4e4e7;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">When</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#09090b;">${when}${endNote}</p>
      </div>
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#09090b;">What to expect</p>
      <ul style="margin:0 0 24px;padding-left:20px;color:#3f3f46;">
        <li style="margin-bottom:8px;">A focused audit of your current sales and ops flow</li>
        <li style="margin-bottom:8px;">Concrete examples of AI agents handling calls and follow-ups</li>
        <li style="margin-bottom:8px;">Clear next steps — no pitch deck, no fluff</li>
      </ul>
      <p style="margin:0;font-size:13px;color:#71717a;">Join from a laptop if possible. Calendar invite has your meeting link.</p>
    </div>
    <div style="background:#fafaf9;border-top:1px solid #e4e4e7;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#a1a1aa;">FLODON · AI calling agents &amp; automation</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Queues a personalised outreach email with a random delay.
 */
export async function queueOutreachEmail(clientId, dealId, clientData) {
  const { min, max } = await getQueueDelaySettings()
  const scheduledAt = randomScheduledAt(min, max)
  const { subject, html } = await generateOutreachEmail(clientData)

  const { data, error } = await supabase
    .from('email_queue')
    .insert({
      client_id: clientId,
      deal_id: dealId || null,
      type: 'outreach',
      status: 'queued',
      subject,
      html_body: html,
      scheduled_at: scheduledAt,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to queue outreach email: ${error.message}`)

  log(`[EmailQueue] Outreach queued (id=${data.id}) for ${scheduledAt}`)
  return { success: true, id: data.id, scheduledAt }
}

/**
 * Queues an immediate call booking confirmation email.
 */
export async function queueCallBookingEmail(clientId, dealId, callId, callData) {
  const name = callData.name || callData.prospect_name || 'there'
  const subject = `Your FLODON discovery call is confirmed — ${name}`
  const html = buildCallBookingHtml({
    name,
    date: callData.date || callData.booked_date,
    startTime: callData.startTime || callData.booked_start || callData.start_time,
    endTime: callData.endTime || callData.booked_end || callData.end_time,
  })

  const { data, error } = await supabase
    .from('email_queue')
    .insert({
      client_id: clientId,
      deal_id: dealId || null,
      call_id: callId || null,
      type: 'call_booking_confirmation',
      status: 'queued',
      subject,
      html_body: html,
      scheduled_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to queue call booking email: ${error.message}`)

  log(`[EmailQueue] Call booking confirmation queued (id=${data.id})`)
  return { success: true, id: data.id }
}

async function resolveRecipientEmail(row) {
  if (!row.client_id) return null

  const { data, error } = await supabase
    .from('clients')
    .select('email')
    .eq('id', row.client_id)
    .maybeSingle()

  if (error || !data?.email) return null
  return data.email
}

/**
 * Processes up to 5 queued emails that are due to send.
 */
export async function processEmailQueue() {
  const { data: rows, error } = await supabase
    .from('email_queue')
    .select('id, client_id, subject, html_body')
    .eq('status', 'queued')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(MAX_PER_RUN)

  if (error) {
    log(`[EmailQueue] Fetch failed: ${error.message}`, 'error')
    return { processed: 0, sent: 0, failed: 0, error: error.message }
  }

  if (!rows?.length) return { processed: 0, sent: 0, failed: 0 }

  let sent = 0
  let failed = 0

  for (const row of rows) {
    await supabase.from('email_queue').update({ status: 'sending' }).eq('id', row.id)

    const to = await resolveRecipientEmail(row)
    if (!to) {
      await supabase.from('email_queue').update({
        status: 'failed',
        error_message: 'No recipient email found for client',
      }).eq('id', row.id)
      failed++
      continue
    }

    const result = await sendResendEmail({
      to,
      subject: row.subject,
      html: row.html_body,
    })

    if (result.success) {
      await supabase.from('email_queue').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        resend_message_id: result.messageId,
      }).eq('id', row.id)
      sent++
    } else {
      await supabase.from('email_queue').update({
        status: 'failed',
        error_message: result.error || 'Unknown send error',
      }).eq('id', row.id)
      failed++
    }
  }

  log(`[EmailQueue] Processed ${rows.length}: ${sent} sent, ${failed} failed`)
  return { processed: rows.length, sent, failed }
}
