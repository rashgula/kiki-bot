const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

function buildServerIconEmbed(guild) {
  const iconUrl = guild.iconURL({ size: 1024, dynamic: true });
  if (!iconUrl) {
    return KikiEmbed.info('No Server Icon', `**${guild.name}** ka abhi koi server icon set nahi hai.`);
  }
  return KikiEmbed.purple(`🖼️ Server Icon • ${guild.name}`,
    `[PNG](${guild.iconURL({ extension: 'png', size: 1024 })}) | [JPG](${guild.iconURL({ extension: 'jpg', size: 1024 })}) | [WEBP](${guild.iconURL({ extension: 'webp', size: 1024 })})`
  ).setImage(iconUrl);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-avatar-view')
    .setDescription('🖼️ View the server icon in high resolution'),

  aliases: ['k-server-avatar-view', 'serveravatarview', 'servericon'],
  name: 'server-avatar-view',

  async execute(interaction) {
    await interaction.reply({ embeds: [buildServerIconEmbed(interaction.guild)] });
  },

  async run(message) {
    message.reply({ embeds: [buildServerIconEmbed(message.guild)] });
  }
};
