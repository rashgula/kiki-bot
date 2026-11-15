const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
module.exports = {
  data: new SlashCommandBuilder().setName('uptime').setDescription('⏱️ View KIKI uptime'),
  async execute(interaction, client) {
    const uptimeStr = KIKI.formatDuration(client.uptime);
    await interaction.reply({ embeds: [KikiEmbed.purple('⏱️ KIKI Uptime', `Active in the void for: **${uptimeStr}**`)] });
  },
  name: 'uptime', aliases: ['up'],
  async run(message, args, client) {
    message.reply({ embeds: [KikiEmbed.purple('Uptime', `Online for: ${KIKI.formatDuration(client.uptime)}`)] });
  }
};
