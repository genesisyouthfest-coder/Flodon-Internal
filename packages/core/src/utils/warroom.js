import { supabase } from '../supabase.js'
import { CHANNELS } from '../config.js'
import { log } from './logger.js'

export async function updateWarRoom(guild) {
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const monthStr = startOfMonth.toISOString().split('T')[0]

    // Total MRR (all deals)
    const { data: deals } = await supabase.from('deals').select('amount_monthly')
    const totalMRR = deals?.reduce((s, d) => s + (d.amount_monthly || 0), 0) || 0

    // Churn this month
    const { data: churns } = await supabase
      .from('churn')
      .select('amount_monthly')
      .gte('churned_at', startOfMonth.toISOString())
    const totalChurn = churns?.reduce((s, c) => s + (c.amount_monthly || 0), 0) || 0

    // Deals added this month (net new)
    const { data: newDeals } = await supabase
      .from('deals')
      .select('amount_monthly')
      .gte('created_at', startOfMonth.toISOString())
    const netNew = newDeals?.reduce((s, d) => s + (d.amount_monthly || 0), 0) || 0

    // Outreach this month per platform
    const { data: outreach } = await supabase
      .from('outreach')
      .select('sent_count, platform')
      .gte('logged_at', monthStr)
    const totalOutreach = outreach?.reduce((s, o) => s + (o.sent_count || 0), 0) || 0
    const byPlatform = {}
    outreach?.forEach(o => {
      byPlatform[o.platform] = (byPlatform[o.platform] || 0) + o.sent_count
    })
    const platformStr = Object.entries(byPlatform)
      .map(([p, n]) => `${p}: ${n}`)
      .join('  ·  ') || 'None yet'

    // Calls this month
    const { data: calls } = await supabase
      .from('calls')
      .select('status')
      .gte('scheduled_at', startOfMonth.toISOString())
    const totalCalls     = calls?.length || 0
    const completedCalls = calls?.filter(c => c.status === 'completed').length || 0
    const showRate       = totalCalls > 0
      ? ((completedCalls / totalCalls) * 100).toFixed(0)
      : '0'

    // Website leads this month
    const { count: webLeadsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('lead_source', 'website')
      .gte('created_at', startOfMonth.toISOString())

    const hotLeadsCount = await (async () => {
      const { data } = await supabase
        .from('clients')
        .select('qualification')
        .eq('lead_source', 'website')
        .gte('created_at', startOfMonth.toISOString())
      return data?.filter(c =>
        c.qualification?.readyToMoveForward === 'Yes' && c.qualification?.investmentLevel
      ).length || 0
    })()

    // Find next milestone
    const { MILESTONES } = await import('../config.js')
    const nextMilestone = MILESTONES.find(m => m.amount > totalMRR)

    const embed = {
      title: '⚔️  WAR ROOM — LIVE STATS',
      color: 0xFFD700,
      fields: [
        {
          name: '💰 Total MRR',
          value: `₹${totalMRR.toLocaleString('en-IN')}/mo`,
          inline: true,
        },
        {
          name: '📈 New MRR (MTD)',
          value: `+₹${netNew.toLocaleString('en-IN')}`,
          inline: true,
        },
        {
          name: '📉 Churn (MTD)',
          value: `-₹${totalChurn.toLocaleString('en-IN')}`,
          inline: true,
        },
        { name: '\u200B', value: '─────────────────────────', inline: false },
        {
          name: '📨 Outreach (MTD)',
          value: `${totalOutreach.toLocaleString('en-IN')} messages\n└─ ${platformStr}`,
          inline: false,
        },
        {
          name: '📞 Calls (MTD)',
          value: `${completedCalls}/${totalCalls} completed  ·  ${showRate}% show rate`,
          inline: false,
        },
        {
          name: '🌐 Web Leads (MTD)',
          value: `${webLeadsCount || 0} inbound  ·  🔥 ${hotLeadsCount} hot`,
          inline: false,
        },
        { name: '\u200B', value: '─────────────────────────', inline: false },
        {
          name: '🏆 Next Milestone',
          value: nextMilestone
            ? `${nextMilestone.emoji} ${nextMilestone.name}  ·  ₹${(nextMilestone.amount - totalMRR).toLocaleString('en-IN')} to go`
            : '🎊 All milestones achieved!',
          inline: false,
        },
      ],
      footer: { text: 'Updates after every deal, churn, call, outreach, or new lead' },
      timestamp: new Date().toISOString(),
    }

    const channel = guild.channels.cache.get(CHANNELS.warroom)
    if (!channel) return

    const messages = await channel.messages.fetch({ limit: 20 })
    const existing = messages.find(m => m.author.bot && m.embeds[0]?.title?.includes('WAR ROOM'))

    if (existing) {
      await existing.edit({ embeds: [embed] })
    } else {
      await channel.send({ embeds: [embed] })
    }

    log('War Room updated', 'ok')
  } catch (err) {
    log(`War Room update failed: ${err.message}`, 'error')
  }
}
