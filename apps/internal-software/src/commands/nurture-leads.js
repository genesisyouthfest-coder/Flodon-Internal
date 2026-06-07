import { supabase } from '@flodon/core'
import { SlashCommandBuilder } from 'discord.js'

export default {
  data: new SlashCommandBuilder()
    .setName('nurture-leads')
    .setDescription('Display the long-term nurture list leads')
    .addIntegerOption(o =>
      o.setName('limit').setDescription('How many to show (default: 10, max: 25)').setRequired(false).setMinValue(1).setMaxValue(25)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 })

    const limit = interaction.options.getInteger('limit') || 10

    const { data: leads, error } = await supabase
      .from('clients')
      .select('id, name, brand_name, email, phone, pipeline_stage, is_nurture, created_at')
      .eq('is_nurture', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return interaction.editReply({ content: 'Failed to fetch nurture leads.' })
    }

    if (!leads || leads.length === 0) {
      return interaction.editReply({ content: 'No leads in the nurture list right now.' })
    }

    const lines = leads.map((lead, i) => {
      const date = new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      const company = lead.brand_name ? ` · ${lead.brand_name}` : ''
      return `\`${String(i + 1).padStart(2, '0')}.\` **${lead.name}**${company}\n       ${lead.email}  ·  ${lead.phone || 'No phone'}  ·  ${date}`
    })

    await interaction.editReply({
      embeds: [{
        title: 'LONG-TERM NURTURE LIST',
        description: lines.join('\n\n'),
        color: 0x22C55E,
        fields: [{ name: 'Shown', value: `${leads.length}`, inline: true }],
        footer: { text: 'These leads receive weekly value emails.' },
        timestamp: new Date().toISOString(),
      }],
    })
  },
}
