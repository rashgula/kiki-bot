const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-uptime-stats')
    .setDescription('⏱️ View live process uptime and start time'),

  aliases: ['k-bot-uptime-stats', 'botuptimestats'],
  name: 'bot-uptime-stats',

  async execute(interaction) {
    const up = KIKI.formatDuration(process.uptime() * 1000);
    const startedAt = Math.floor((Date.now() - process.uptime() * 1000) / 1000);
    await interaction.reply({ embeds: [KikiEmbed.purple('⏱️ KIKI Uptime', `• **Running For:** \`${up}\`\n• **Started:** <t:${startedAt}:F> (<t:${startedAt}:R>)`)] });
  },

  async run(message) {
    const up = KIKI.formatDuration(process.uptime() * 1000);
    const startedAt = Math.floor((Date.now() - process.uptime() * 1000) / 1000);
    message.reply({ embeds: [KikiEmbed.purple('⏱️ KIKI Uptime', `• **Running For:** \`${up}\`\n• **Started:** <t:${startedAt}:F> (<t:${startedAt}:R>)`)] });
  }
};
