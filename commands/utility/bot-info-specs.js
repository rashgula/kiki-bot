const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const config = require('../../config.js');
const KIKI = require('../../utils/kiki.js');

function buildBotEmbed(client) {
  const memMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
  return KikiEmbed.purple(`🔮 ${config.BOT_NAME || 'KIKI'} • Bot Diagnostics`,
    `• **Version:** \`v${config.BOT_VERSION}\`\n` +
    `• **Servers:** \`${client.guilds?.cache?.size || 0}\`\n` +
    `• **Total Commands:** \`${client.totalCommands || 1140}+\`\n` +
    `• **Gateway Ping:** \`${Math.round(client.ws?.ping ?? 0)}ms\`\n` +
    `• **Uptime:** \`${KIKI.formatDuration(process.uptime() * 1000)}\`\n` +
    `• **Memory RSS:** \`${memMb} MB\` | **Node:** \`${process.version}\``
  ).setThumbnail(client.user?.displayAvatarURL?.() || null);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-info-specs')
    .setDescription('🤖 View KIKI bot diagnostics, uptime, memory and command count'),

  aliases: ['k-bot-info-specs', 'botinfospecs'],
  name: 'bot-info-specs',

  async execute(interaction, client) {
    await interaction.reply({ embeds: [buildBotEmbed(client)] });
  },

  async run(message, args, client) {
    message.reply({ embeds: [buildBotEmbed(client)] });
  }
};
