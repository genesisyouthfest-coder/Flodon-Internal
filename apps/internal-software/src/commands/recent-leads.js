import { supabase } from '@flodon/core'
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'


export default {
  data: new SlashCommandBuilder()
    .setName('recent-leads')
    .setDescription('View the last 5 website leads'),

  async execute(interaction) {
    const { data: leads, error } = await supabase
      .from('clients')
      .select('name, brand_name, email, created_at, lead_source')
      .eq('lead_source', 'website')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return interaction.reply({ content: '❌ Error fetching leads.', flags: 64 })
    }

    if (!leads || leads.length === 0) {
      return interaction.reply({ content: '📭 No website leads found.', flags: 64 })
    }

    const embed = new EmbedBuilder()
      .setTitle('🌐 RECENT WEBSITE LEADS')
      .setColor(0x3B82F6)
      .setDescription(leads.map((l, i) => 
        `${i + 1}. **${l.name}** (${l.brand_name || 'Individual'})\n   📧 ${l.email} · <t:${Math.floor(new Date(l.created_at).getTime() / 1000)}:R>`
      ).join('\n\n'))
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  },
}
