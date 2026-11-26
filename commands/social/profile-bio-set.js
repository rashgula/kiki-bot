const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Social = require('../../utils/social.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile-bio-set')
    .setDescription('📝 Set personal biography snippet on your profile')
    .addStringOption(o => o.setName('bio').setDescription('Your gothic bio').setRequired(true)),

  async execute(interaction) {
    const prof = Social.setBio(interaction.guildId, interaction.user.id, interaction.options.getString('bio'));
    await interaction.reply({ embeds: [KikiEmbed.success('Profile Bio Updated 📝', `> *${prof.bio}*`)] });
  },

  name: 'profile-bio-set',
  aliases: ['k-profile-bio-set', 'profilebioset', 'setbio'],
  async run(message, args) {
    const bio = args.join(' ');
    if (!bio) return message.reply({ embeds: [KikiEmbed.warn('Bio Missing', 'Usage: `&setbio Your bio text here`')] });
    const prof = Social.setBio(message.guild.id, message.author.id, bio);
    message.reply({ embeds: [KikiEmbed.success('Profile Bio Updated 📝', `> *${prof.bio}*`)] });
  }
};
