const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

function buildServerEmbed(guild) {
  return KikiEmbed.purple(`🏰 Server Specs • ${guild.name}`, `**Server ID:** \`${guild.id}\``)
    .setThumbnail(guild.iconURL({ dynamic: true }) || null)
    .addFields(
      { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
      { name: '👥 Members', value: `\`${guild.memberCount.toLocaleString()}\``, inline: true },
      { name: '🚀 Boosts', value: `Tier ${guild.premiumTier} (\`${guild.premiumSubscriptionCount || 0}\`)`, inline: true },
      { name: '📁 Channels', value: `\`${guild.channels.cache.size}\``, inline: true },
      { name: '🏷️ Roles', value: `\`${guild.roles.cache.size}\``, inline: true },
      { name: '🎭 Emojis', value: `\`${guild.emojis.cache.size}\``, inline: true },
      { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: false }
    );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-info-detailed')
    .setDescription('🏰 Inspect detailed server metrics, owner, boosts and channels'),

  aliases: ['k-server-info-detailed', 'serverinfodetailed'],
  name: 'server-info-detailed',

  async execute(interaction) {
    await interaction.reply({ embeds: [buildServerEmbed(interaction.guild)] });
  },

  async run(message) {
    message.reply({ embeds: [buildServerEmbed(message.guild)] });
  }
};
