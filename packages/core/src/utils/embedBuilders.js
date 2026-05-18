// ─────────────────────────────────────────────
//  Pure Minimalist Booking Records
// ─────────────────────────────────────────────

/**
 * Builds a pure minimalist embed for website leads.
 */
export function buildWebLeadEmbed(lead) {
  const q = lead.qualification || lead || {}
  const name = lead.name || 'N/A'
  const email = lead.email || 'N/A'
  const phone = lead.phone || lead.phone_number || 'N/A'
  const website = lead.website || q.website || lead.source_url || 'N/A'
  
  const date = lead.date || lead.booked_date || 'N/A'
  const start = lead.startTime || lead.booked_start || 'N/A'
  const end = lead.endTime || lead.booked_end || ''

  const fields = [
    { name: 'Name', value: name, inline: false },
    { name: 'Email', value: email, inline: false },
    { name: 'Phone', value: phone, inline: false },
    { name: 'Date & Time', value: `${date} | ${start}${end ? ` - ${end}` : ''} (IST)`, inline: false },
    { name: 'Website', value: website, inline: false },
    { name: 'Business Description', value: q.businessDescription || 'N/A', inline: false },
    { name: 'Revenue', value: q.monthlyRevenue || 'N/A', inline: false },
    { name: 'Investment', value: q.investmentLevel || 'N/A', inline: false },
    { name: 'Timeline', value: q.readyToImplement || 'N/A', inline: false },
    { name: 'Decision Maker', value: q.decisionMaker || 'N/A', inline: false },
    { name: 'Lead Source', value: q.leadSources || q.leadSource || 'N/A', inline: false },
    { name: 'Biggest Bottleneck', value: q.biggestBottleneck || 'N/A', inline: false },
    { name: '90-Day Goal', value: q.ninetyDayGoal || q.goal || 'N/A', inline: false },
    { name: 'Quick Actions', value: '🖥️ [Visit Software Dashboard](https://flodon-internal-software.onrender.com)  ·  💼 [Visit Ops Portal](https://flodon.in/ops)', inline: false },
  ]

  return {
    title: 'NEW BOOKING',
    color: 0x2b2d31,
    fields,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Builds a minimalist cancellation alert.
 */
export function buildWebhookCancelEmbed(payload) {
  return {
    title: 'CALL CANCELLED',
    color: 0x000000, 
    fields: [
      { name: 'Name', value: payload.name || 'N/A', inline: false },
      { name: 'Email', value: payload.email || 'N/A', inline: false },
      { name: 'Phone', value: payload.phone || payload.phone_number || 'N/A', inline: false },
      { name: 'Date & Time', value: `${payload.date || 'N/A'} | ${payload.startTime || 'N/A'}`, inline: false },
      { name: 'Reason', value: payload.reason || 'N/A', inline: false },
      { name: 'Quick Actions', value: '🖥️ [Visit Software Dashboard](https://flodon-internal-software.onrender.com)  ·  💼 [Visit Ops Portal](https://flodon.in/ops)', inline: false },
    ],
    timestamp: new Date().toISOString(),
  }
}

/**
 * Builds a minimalist deal log.
 */
export function buildDealEmbed(deal, username) {
  return {
    title: 'DEAL SECURED',
    color: 0x000000,
    fields: [
      { name: 'Name', value: deal.client_name || 'N/A', inline: false },
      { name: 'Revenue', value: `₹${deal.amount_monthly?.toLocaleString('en-IN') || '0'}`, inline: false },
      { name: 'Venture', value: deal.venture || 'N/A', inline: false }
    ],
    footer: { text: `Logged by: ${username}` },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Builds a minimalist outreach log.
 */
export function buildOutreachEmbed(data, username) {
  const rate = data.sent_count > 0
    ? ((data.reply_count / data.sent_count) * 100).toFixed(1)
    : '0.0'

  return {
    title: 'OUTREACH LOG',
    color: 0x2b2d31,
    fields: [
      { name: 'Channel', value: data.platform?.toUpperCase() || 'N/A', inline: false },
      { name: 'Sent', value: String(data.sent_count || 0), inline: false },
      { name: 'Replies', value: String(data.reply_count || 0), inline: false },
      { name: 'Rate', value: `${rate}%`, inline: false },
    ],
    footer: { text: `Logged by: ${username}` },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Builds a minimalist call log.
 */
export function buildCallEmbed(data, username) {
  return {
    title: `CALL LOG: ${data.status?.toUpperCase() || 'LOGGED'}`,
    color: 0x2b2d31,
    fields: [
      { name: 'Name', value: data.prospect_name || 'N/A', inline: false },
      { name: 'Source', value: data.source?.toUpperCase() || 'N/A', inline: false },
      { name: 'Outcome', value: data.outcome?.replace(/_/g, ' ').toUpperCase() || 'N/A', inline: false },
    ],
    footer: { text: `Logged by: ${username}` },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Builds a minimalist payment log.
 */
export function buildPaymentEmbed(data, username) {
  return {
    title: 'PAYMENT RECEIVED',
    color: 0x000000,
    fields: [
      { name: 'Name', value: data.client_name || 'N/A', inline: false },
      { name: 'Amount', value: `₹${data.amount?.toLocaleString('en-IN') || '0'}`, inline: false },
      { name: 'Gateway', value: data.provider?.toUpperCase() || 'N/A', inline: false },
    ],
    footer: { text: `Logged by: ${username}` },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Builds a minimalist churn log.
 */
export function buildChurnEmbed(data, username) {
  return {
    title: 'CLIENT CHURN',
    color: 0x000000,
    fields: [
      { name: 'Name', value: data.client_name || 'N/A', inline: false },
      { name: 'Impact', value: `-₹${data.amount_monthly?.toLocaleString('en-IN') || '0'}`, inline: false },
      { name: 'Reason', value: data.reason?.toUpperCase() || 'N/A', inline: false },
    ],
    footer: { text: `Logged by: ${username}` },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Builds a minimalist cancellation/rejection alert.
 */
export function buildCallStatusEmbed(call, status) {
  return {
    title: status === 'cancelled' ? 'CALL CANCELLED' : 'CALL REJECTED',
    color: 0x000000,
    fields: [
      { name: 'Name', value: call.prospect_name || 'N/A', inline: false },
      { name: 'Date & Time', value: new Date(call.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), inline: false },
      { name: 'Reason', value: call.outcome || 'N/A', inline: false }
    ],
    timestamp: new Date().toISOString(),
  }
}
