import nodemailer from 'nodemailer'
import { log } from './logger.js'

// ─── Gmail SMTP Transporter (created lazily on first use) ───
let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    log('[Email] Skipping: GMAIL_USER or GMAIL_APP_PASSWORD not configured.', 'warning')
    return null
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  log(`[Email] Gmail SMTP transporter ready (${user})`)
  return transporter
}

/**
 * Sends an email via Gmail SMTP.
 * 
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email address(es)
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML body content
 * @param {string} [options.from] - Sender display name override
 */
export async function sendEmail({ to, subject, html, from }) {
  const smtp = getTransporter()
  if (!smtp) return { success: false, error: 'Gmail SMTP not configured' }

  const fromAddress = from || process.env.GMAIL_FROM_NAME
    ? `${process.env.GMAIL_FROM_NAME || 'Flodon Operations'} <${process.env.GMAIL_USER}>`
    : process.env.GMAIL_USER

  const toList = Array.isArray(to) ? to.join(', ') : to

  try {
    const info = await smtp.sendMail({
      from: fromAddress,
      to: toList,
      subject,
      html,
    })

    log(`[Email] Sent to [${toList}] — Message ID: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    log(`[Email] Failed to send to [${toList}]: ${error.message}`, 'error')
    return { success: false, error: error.message }
  }
}

/**
 * Triggers emails automatically for incoming CRM/Cal.com webhooks.
 * Sends confirmation to the client and detailed alert to the admin.
 * 
 * @param {string} endpoint - 'lead' or 'cancel'
 * @param {Object} payload - Webhook payload
 */
export async function handleWebhookEmails(endpoint, payload) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER

  if (endpoint === 'lead') {
    const clientEmail = payload.email
    const clientName = payload.name || 'Valued Client'
    const date = payload.date || 'N/A'
    const startTime = payload.startTime || 'N/A'
    const website = payload.website || 'N/A'

    // 1. Client Confirmation Email
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
            <li style="margin-bottom: 8px;">Please join from a desktop or laptop computer (we will be reviewing system schemas).</li>
            <li style="margin-bottom: 8px;">Ensure you are in a quiet workspace.</li>
            <li style="margin-bottom: 8px;">Have details regarding your primary CRM and operational bottlenecks ready.</li>
          </ul>
          
          <hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 30px 0;" />
          <p style="font-size: 12px; color: #78716c; margin-bottom: 0;">Need to reschedule or cancel? You can do so directly using the cancellation link in your Google Calendar invite.</p>
        </div>
      `
      await sendEmail({
        to: clientEmail,
        subject: `🚀 Flodon Session Confirmed | ${clientName}`,
        html: clientHtml
      })
    }

    // 2. Admin Notification Email
    if (adminEmail) {
      const q = payload.biggestBottleneck ? payload : (payload.qualification || {})
      const adminHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #1c1917; line-height: 1.6;">
          <h2 style="font-size: 22px; font-weight: 700; color: #0c0a09; margin-bottom: 5px; letter-spacing: -0.025em;">⚡ New Discovery Call Booked</h2>
          <p style="color: #78716c; font-size: 15px; margin-top: 0; margin-bottom: 25px;">A new prospect has scheduled a strategy call and submitted qualification details.</p>
          
          <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; font-size: 15px; font-weight: 600; color: #44403c; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px; margin-bottom: 15px;">Lead Profile</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c; width: 35%;">Name:</td><td style="color: #0c0a09; font-weight: 600;">${clientName}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Email:</td><td style="color: #0c0a09;">${clientEmail || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Phone:</td><td style="color: #0c0a09;">${payload.phone || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Website:</td><td style="color: #0c0a09;"><a href="${website}" style="color: #2563eb; text-decoration: underline;">${website}</a></td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Scheduled:</td><td style="color: #0c0a09; font-weight: 600;">${date} @ ${startTime} IST</td></tr>
            </table>
          </div>
          
          <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin-top: 0; font-size: 15px; font-weight: 600; color: #44403c; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px; margin-bottom: 15px;">Qualification Data</h3>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Revenue:</strong> ${payload.monthlyRevenue || q.monthlyRevenue || 'N/A'}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Investment:</strong> ${payload.investmentLevel || q.investmentLevel || 'N/A'}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Ready to Implement:</strong> ${payload.readyToImplement || q.readyToImplement || 'N/A'}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Decision Maker:</strong> ${payload.decisionMaker || q.decisionMaker || 'N/A'}</p>
            <p style="font-size: 14px; margin: 8px 0;"><strong>Lead Source:</strong> ${payload.leadSources || q.leadSources || q.leadSource || 'N/A'}</p>
            <p style="font-size: 14px; margin: 12px 0 6px 0;"><strong>Biggest Bottleneck:</strong><br/><span style="color: #44403c; font-style: italic;">"${payload.biggestBottleneck || q.biggestBottleneck || 'N/A'}"</span></p>
            <p style="font-size: 14px; margin: 12px 0 6px 0;"><strong>90-Day Goal:</strong><br/><span style="color: #44403c; font-style: italic;">"${payload.ninetyDayGoal || q.ninetyDayGoal || q.goal || 'N/A'}"</span></p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://flodon-internal-software.onrender.com" style="background-color: #0c0a09; color: #fafaf9; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; margin-right: 10px;">🖥️ Visit Software Dashboard</a>
            <a href="https://flodon.in/ops" style="background-color: #44403c; color: #fafaf9; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">💼 Visit Ops Portal</a>
          </div>
        </div>
      `
      await sendEmail({
        to: adminEmail,
        subject: `⚡ [New Lead] ${clientName} - ${website}`,
        html: adminHtml
      })
    }
  } 
  
  else if (endpoint === 'cancel') {
    const clientEmail = payload.email
    const clientName = payload.name || 'Valued Client'
    const date = payload.date || 'N/A'
    const startTime = payload.startTime || 'N/A'
    const reason = payload.reason || 'Requested by client'

    // 1. Client Cancellation Confirmation
    if (clientEmail) {
      const clientCancelHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #1c1917; line-height: 1.6;">
          <h2 style="font-size: 24px; font-weight: 700; color: #7f1d1d; margin-bottom: 20px; letter-spacing: -0.025em;">Session Cancellation Confirmed</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${clientName}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 20px;">This email confirms that your strategy session scheduled for <strong>${date} at ${startTime} IST</strong> has been successfully cancelled.</p>
          <p style="font-size: 16px; margin-bottom: 20px; font-style: italic; color: #44403c;">Reason for cancellation: "${reason}"</p>
          
          <p style="font-size: 16px; margin-top: 25px; margin-bottom: 20px;">If you would like to book a new slot at a more convenient date or time, please visit our booking calendar:</p>
          <p style="margin: 25px 0;">
            <a href="https://flodon.in/book-a-call" style="background-color: #0c0a09; color: #fafaf9; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Book A New Slot</a>
          </p>
        </div>
      `
      await sendEmail({
        to: clientEmail,
        subject: `⚠️ Cancelled: Flodon Discovery Session`,
        html: clientCancelHtml
      })
    }

    // 2. Admin Cancellation Alert
    if (adminEmail) {
      const adminCancelHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #1c1917; line-height: 1.6;">
          <h2 style="font-size: 22px; font-weight: 700; color: #7f1d1d; margin-bottom: 20px; letter-spacing: -0.025em;">🛑 Call Cancelled Alert</h2>
          
          <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; font-weight: 600; color: #7f1d1d; width: 35%;">Lead Name:</td><td style="color: #7f1d1d; font-weight: 600;">${clientName}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Lead Email:</td><td style="color: #0c0a09;">${clientEmail || 'N/A'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Scheduled For:</td><td style="color: #0c0a09; font-weight: 600;">${date} @ ${startTime} IST</td></tr>
              <tr><td style="padding: 6px 0; font-weight: 600; color: #78716c;">Reason:</td><td style="color: #b91c1c; font-style: italic;">"${reason}"</td></tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://flodon-internal-software.onrender.com" style="background-color: #0c0a09; color: #fafaf9; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; margin-right: 10px;">🖥️ Visit Software Dashboard</a>
            <a href="https://flodon.in/ops" style="background-color: #44403c; color: #fafaf9; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">💼 Visit Ops Portal</a>
          </div>
        </div>
      `
      await sendEmail({
        to: adminEmail,
        subject: `🛑 [Cancelled] ${clientName}`,
        html: adminCancelHtml
      })
    }
  }
}
