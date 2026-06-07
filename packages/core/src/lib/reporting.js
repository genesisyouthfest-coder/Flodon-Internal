import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'
import { sendResendEmail } from './resend.js'
import { getRevenueSnapshot } from './revenueIntelligence.js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

function formatINR(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`
}

function generateWeeklyDigestHtml(stats) {
  const mrrTrend = stats.mrrChange >= 0 ? `📈 +${formatINR(stats.mrrChange)}` : `📉 ${formatINR(stats.mrrChange)}`

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#09090b;padding:32px;text-align:center;">
      <p style="margin:0;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#a1a1aa;">FLODON</p>
      <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#fafaf9;">Weekly Operations Digest</h1>
      <p style="margin:4px 0 0;font-size:14px;color:#71717a;">${stats.weekRange}</p>
    </div>
    <div style="padding:32px;color:#18181b;line-height:1.6;font-size:15px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;">
        <div style="background:#fafaf9;border:1px solid #e4e4e7;border-radius:8px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Current MRR</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#09090b;">${formatINR(stats.currentMRR)}</p>
        </div>
        <div style="background:#fafaf9;border:1px solid #e4e4e7;border-radius:8px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">MRR Change</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#09090b;">${mrrTrend}</p>
        </div>
        <div style="background:#fafaf9;border:1px solid #e4e4e7;border-radius:8px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">New This Week</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#09090b;">${formatINR(stats.newMRR)}</p>
        </div>
        <div style="background:#fafaf9;border:1px solid #e4e4e7;border-radius:8px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Churn</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#dc2626;">${formatINR(stats.churnMRR)}</p>
        </div>
      </div>

      <div style="background:#fafaf9;border:1px solid #e4e4e7;border-radius:8px;padding:20px;margin-bottom:20px;">
        <h3 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#09090b;">Pipeline Overview</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #e4e4e7;color:#71717a;">Pipeline Value</td><td style="text-align:right;font-weight:600;">${formatINR(stats.pipelineValue)}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e4e4e7;color:#71717a;">Weighted Pipeline</td><td style="text-align:right;font-weight:600;">${formatINR(stats.weightedPipeline)}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e4e4e7;color:#71717a;">Win Rate</td><td style="text-align:right;font-weight:600;">${(stats.winRate * 100).toFixed(0)}%</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;">Avg Deal Size</td><td style="text-align:right;font-weight:600;">${formatINR(stats.avgDealSize)}</td></tr>
        </table>
      </div>

      <div style="background:#fafaf9;border:1px solid #e4e4e7;border-radius:8px;padding:20px;margin-bottom:20px;">
        <h3 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#09090b;">Activity Summary</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #e4e4e7;color:#71717a;">New Leads</td><td style="text-align:right;font-weight:600;">${stats.newLeads}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e4e4e7;color:#71717a;">Calls Completed</td><td style="text-align:right;font-weight:600;">${stats.callsCompleted}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e4e4e7;color:#71717a;">Outreach Messages</td><td style="text-align:right;font-weight:600;">${stats.outreachSent}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;">Deals Closed</td><td style="text-align:right;font-weight:600;">${stats.dealsClosed}</td></tr>
        </table>
      </div>

      <div style="text-align:center;padding-top:8px;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;">FLODON Internal Operations · Generated ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export async function generateWeeklyDigest() {
  try {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const weekRange = `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`

    const [
      { data: currentDeals },
      { data: prevDeals },
      { data: newChurn },
      { data: prevChurn },
      { count: newLeads },
      { data: calls },
      { data: outreach },
      { data: closedDeals },
    ] = await Promise.all([
      supabase.from('deals').select('amount_monthly, stage'),
      supabase.from('deals').select('amount_monthly, stage').gte('logged_at', twoWeeksAgo.toISOString()).lt('logged_at', weekAgo.toISOString()),
      supabase.from('churn').select('amount_monthly').gte('churned_at', weekAgo.toISOString()),
      supabase.from('churn').select('amount_monthly').gte('churned_at', twoWeeksAgo.toISOString()).lt('churned_at', weekAgo.toISOString()),
      supabase.from('clients').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
      supabase.from('calls').select('status').gte('scheduled_at', weekAgo.toISOString()),
      supabase.from('outreach').select('sent_count').gte('logged_at', weekAgo.toISOString().slice(0, 10)),
      supabase.from('deals').select('id', { count: 'exact', head: true }).gte('updated_at', weekAgo.toISOString()).in('stage', ['closed_won', 'closed_lost']),
    ])

    const currentMRR = currentDeals?.filter(d => d.stage === 'won').reduce((s, d) => s + Number(d.amount_monthly || 0), 0) || 0

    const prevMRR = prevDeals?.filter(d => d.stage === 'won').reduce((s, d) => s + Number(d.amount_monthly || 0), 0) || 0

    const newMRR = (currentDeals || [])
      .filter(d => d.stage === 'won')
      .reduce((s, d) => s + Number(d.amount_monthly || 0), 0) - prevMRR

    const churnMRR = (newChurn?.data || []).reduce((s, c) => s + Number(c.amount_monthly || 0), 0)
    const prevChurnMRR = (prevChurn?.data || []).reduce((s, c) => s + Number(c.amount_monthly || 0), 0)
    const mrrChange = newMRR - churnMRR

    const openDeals = (currentDeals || []).filter(d => !['won', 'lost'].includes(d.stage))
    const pipelineValue = openDeals.reduce((s, d) => s + Number(d.amount_monthly || 0), 0)
    const weightedPipeline = openDeals.reduce((s, d) => s + Number(d.amount_monthly || 0) * ((d.probability || 50) / 100), 0)

    const wonDeals = (currentDeals || []).filter(d => d.stage === 'won')
    const totalClosed = wonDeals.length + (currentDeals || []).filter(d => d.stage === 'lost').length
    const winRate = totalClosed > 0 ? wonDeals.length / totalClosed : 0
    const avgDealSize = wonDeals.length > 0 ? wonDeals.reduce((s, d) => s + Number(d.amount_monthly || 0), 0) / wonDeals.length : 0

    const callsCompleted = (calls?.data || []).filter(c => c.status === 'completed').length
    const outreachSent = (outreach?.data || []).reduce((s, o) => s + (o.sent_count || 0), 0)

    const stats = {
      weekRange,
      currentMRR,
      newMRR,
      churnMRR,
      mrrChange,
      prevMRR,
      prevChurnMRR,
      pipelineValue: Math.round(pipelineValue),
      weightedPipeline: Math.round(weightedPipeline),
      winRate,
      avgDealSize: Math.round(avgDealSize),
      newLeads: newLeads || 0,
      callsCompleted,
      outreachSent,
      dealsClosed: closedDeals?.count || 0,
    }

    const html = generateWeeklyDigestHtml(stats)

    const recipients = [ADMIN_EMAIL].filter(Boolean)

    if (recipients.length > 0) {
      for (const recipient of recipients) {
        await sendResendEmail({
          to: recipient,
          subject: `📊 FLODON Weekly Digest — ${weekRange}`,
          html,
        })
      }
    }

    await supabase.from('report_logs').insert({
      recipient_count: recipients.length,
      html_body: html,
      status: 'sent',
    })

    log(`[Reporting] Weekly digest sent to ${recipients.length} recipient(s)`, 'ok')
    return { success: true, stats }
  } catch (err) {
    log(`[Reporting] Weekly digest generation failed: ${err.message}`, 'error')

    await supabase.from('report_logs').insert({
      status: 'failed',
      error_message: err.message,
    })

    return { success: false, error: err.message }
  }
}
