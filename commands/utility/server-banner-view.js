const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

function buildServerBannerEmbed(guild) {
  const banner = guild.bannerURL({ size: 1024 });
  if (!banner) {
    return KikiEmbed.info('No Server Banner', `**${guild.name}** ke paas server banner set nahi hai (Level 2+ Boost required).`);
  }
  return KikiEmbed.purple(`🏴 Server Banner • ${guild.name}`, `[Open Full Image](${banner})`).setImage(banner);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-banner-view')
    .setDescription('🏴 View the server banner in high resolution'),

  aliases: ['k-server-banner-view', 'serverbannerview', 'serverbanner'],
  name: 'server-banner-view',

  async execute(interaction) {
    await interaction.reply({ embeds: [buildServerBannerEmbed(interaction.guild)] });
  },

  async run(message) {
    message.reply({ embeds: [buildServerBannerEmbed(message.guild)] });
  }
};
