import { supabase } from '@flodon/core'
import { SlashCommandBuilder } from 'discord.js'


export default {
  data: new SlashCommandBuilder()
    .setName('webleads')
    .setDescription('Display website-sourced leads only — with qualification intel')
    .addIntegerOption(o =>
      o.setName('limit').setDescription('How many to show (default: 10, max: 25)').setRequired(false).setMinValue(1).setMaxValue(25)
    )
    .addStringOption(o =>
      o.setName('since').setDescription('Time range').setRequired(false)
        .addChoices(
          { name: 'Last 7 Days',  value: '7'  },
          { name: 'Last 30 Days', value: '30' },
          { name: 'All Time',     value: '0'  },
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 })

    const limit = interaction.options.getInteger('limit') || 10
    const since = interaction.options.getString('since') || '7'

    let query = supabase
      .from('clients')
      .select('id, name, brand_name, email, phone, pipeline_stage, qualification, booked_date, booked_start, booked_end, created_at')
      .eq('source', 'website')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (since !== '0') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - parseInt(since))
      query = query.gte('created_at', cutoff.toISOString())
    }

    const { data: leads, error } = await query

    if (error) {
      return interaction.editReply({ content: '❌ Failed to fetch web leads.' })
    }

    if (!leads || leads.length === 0) {
      return interaction.editReply({ content: '📭 No website leads found in this time range.' })
    }

    const hotCount = leads.filter(l =>
      l.qualification?.readyToMoveForward === 'Yes' && l.qualification?.investmentLevel
    ).length

    const lines = leads.map((lead, i) => {
      const q = lead.qualification || {}
      const isHot = q.readyToMoveForward === 'Yes' && q.investmentLevel
      const date  = new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      const company = lead.brand_name ? ` · ${lead.brand_name}` : ''
      const callStr = lead.booked_date ? `  📅 Call: ${lead.booked_date} ${lead.booked_start || ''}` : ''
      const revenueStr = q.monthlyRevenue ? `  💰 ${q.monthlyRevenue}` : ''
      const investStr  = q.investmentLevel ? `  💳 ${q.investmentLevel}` : ''
      const hotTag     = isHot ? '  🔥 **HOT**' : ''

      return `\`${String(i + 1).padStart(2, '0')}.\` **${lead.name}**${company}${hotTag}\n       ${lead.email}  ·  ${date}${revenueStr}${investStr}${callStr}`
    })

    const rangeStr = since === '0' ? 'all time' : `last ${since} days`

    await interaction.editReply({
      embeds: [{
        title: `🌐 WEBSITE LEADS — ${rangeStr}`,
        description: lines.join('\n\n'),
        color: 0x3B82F6,
        fields: [
          { name: '📊 Shown',     value: `${leads.length}`,  inline: true },
          { name: '🔥 Hot Leads', value: `${hotCount}`,      inline: true },
        ],
        footer: { text: 'Hot = ready to move forward + has investment level set  ·  Use /leads for all sources' },
        timestamp: new Date().toISOString(),
      }],
    })
  },
}
