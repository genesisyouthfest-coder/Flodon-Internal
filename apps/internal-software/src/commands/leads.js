import { supabase } from '@flodon/core'
import { SlashCommandBuilder } from 'discord.js'


const STAGE_EMOJI = {
  prospect:              '🔵',
  contacted:             '📨',
  replied:               '💬',
  discovery_booked:      '📅',
  discovery_completed:   '🔍',
  audit_proposed:        '📄',
  audit_purchased:       '💰',
  audit_delivered:       '📊',
  implementation_proposed: '🤝',
  client:                '✅',
  nurture:               '🌱',
  lost:                  '❌',
  lead:                  '🔵',
  demo:                  '🎬',
  proposal:              '📄',
  negotiation:           '🤝',
  won:                   '✅',
}

const SOURCE_EMOJI = {
  website: '🌐',
  manual:  '📋',
}

export default {
  data: new SlashCommandBuilder()
    .setName('leads')
    .setDescription('Display all leads (website + manually added)')
    .addIntegerOption(o =>
      o.setName('limit').setDescription('How many to show (default: 10, max: 25)').setRequired(false).setMinValue(1).setMaxValue(25)
    )
    .addStringOption(o =>
      o.setName('stage').setDescription('Filter by pipeline stage').setRequired(false)
        .addChoices(
          { name: 'All Stages',              value: 'all'                   },
          { name: 'Prospect',                value: 'prospect'              },
          { name: 'Contacted',               value: 'contacted'             },
          { name: 'Replied',                 value: 'replied'               },
          { name: 'Discovery Booked',        value: 'discovery_booked'      },
          { name: 'Discovery Completed',     value: 'discovery_completed'   },
          { name: 'Audit Proposed',          value: 'audit_proposed'        },
          { name: 'Audit Purchased',         value: 'audit_purchased'       },
          { name: 'Audit Delivered',         value: 'audit_delivered'       },
          { name: 'Implementation Proposed', value: 'implementation_proposed' },
          { name: 'Client',                  value: 'client'                },
          { name: 'Nurture',                 value: 'nurture'               },
          { name: 'Lost',                    value: 'lost'                  },
        )
    )
    .addStringOption(o =>
      o.setName('source').setDescription('Filter by source').setRequired(false)
        .addChoices(
          { name: 'All Sources', value: 'all'     },
          { name: 'Website',     value: 'website' },
          { name: 'Manual',      value: 'manual'  },
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 })

    const limit  = interaction.options.getInteger('limit') || 10
    const stage  = interaction.options.getString('stage')  || 'all'
    const source = interaction.options.getString('source') || 'all'

    let query = supabase
      .from('clients')
      .select('id, name, brand_name, email, pipeline_stage, lead_source, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (stage  !== 'all') query = query.eq('pipeline_stage', stage)
    if (source !== 'all') query = query.eq('lead_source', source)

    const { data: leads, error } = await query

    if (error) {
      return interaction.editReply({ content: '❌ Failed to fetch leads.' })
    }

    if (!leads || leads.length === 0) {
      return interaction.editReply({ content: '📭 No leads found with those filters.' })
    }

    const lines = leads.map((lead, i) => {
      const srcEmoji   = SOURCE_EMOJI[lead.lead_source] || '❓'
      const stageEmoji = STAGE_EMOJI[lead.pipeline_stage] || '•'
      const date       = new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      const company    = lead.brand_name ? ` (${lead.brand_name})` : ''
      return `\`${String(i + 1).padStart(2, '0')}.\` ${srcEmoji} **${lead.name}**${company}\n       ${stageEmoji} \`${lead.pipeline_stage}\`  ·  ${lead.email}  ·  ${date}`
    })

    const filterStr = [
      stage  !== 'all' ? `stage: ${stage}` : null,
      source !== 'all' ? `source: ${source}` : null,
    ].filter(Boolean).join('  ·  ') || 'all sources & stages'

    await interaction.editReply({
      embeds: [{
        title: `📋 ALL LEADS — Flodon CRM`,
        description: lines.join('\n\n'),
        color: 0x1E1E1E,
        footer: { text: `Showing ${leads.length} leads  ·  Filter: ${filterStr}  ·  Use /webleads for website-only intel` },
        timestamp: new Date().toISOString(),
      }],
    })
  },
}
