const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Social = require('../../utils/social.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile-title-set')
    .setDescription('🏷️ Set custom gothic title badge on your profile')
    .addStringOption(o => o.setName('title').setDescription('Custom title text').setRequired(true)),

  async execute(interaction) {
    const prof = Social.setTitle(interaction.guildId, interaction.user.id, interaction.options.getString('title'));
    await interaction.reply({ embeds: [KikiEmbed.success('Profile Title Updated 🏷️', `New title: **${prof.title}**`)] });
  },

  name: 'profile-title-set',
  aliases: ['k-profile-title-set', 'profiletitleset', 'settitle'],
  async run(message, args) {
    const title = args.join(' ');
    if (!title) return message.reply({ embeds: [KikiEmbed.warn('Title Missing', 'Usage: `&settitle Shadow King`')] });
    const prof = Social.setTitle(message.guild.id, message.author.id, title);
    message.reply({ embeds: [KikiEmbed.success('Profile Title Updated 🏷️', `New title: **${prof.title}**`)] });
  }
};
