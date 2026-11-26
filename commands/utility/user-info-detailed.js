const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

function buildUserEmbed(member) {
  const user = member.user;
  const roles = member.roles?.cache?.filter(r => r.id !== member.guild.id).map(r => r.toString()).slice(0, 15) || [];
  return KikiEmbed.purple(`👤 User Info • ${user.tag}`, `**User ID:** \`${user.id}\``)
    .setThumbnail(user.displayAvatarURL?.({ dynamic: true }) || null)
    .addFields(
      { name: '📅 Joined Server', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
      { name: '📆 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: '🤖 Bot Account', value: user.bot ? 'Yes' : 'No', inline: true },
      { name: `🏷️ Roles (${Math.max(0, (member.roles?.cache?.size || 1) - 1)})`, value: roles.length ? roles.join(' ') : 'None', inline: false }
    );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user-info-detailed')
    .setDescription('👤 Inspect detailed account and server member metadata')
    .addUserOption(o => o.setName('user').setDescription('Target member')),

  aliases: ['k-user-info-detailed', 'userinfodetailed'],
  name: 'user-info-detailed',

  async execute(interaction) {
    const member = interaction.options.getMember('user') || interaction.member;
    await interaction.reply({ embeds: [buildUserEmbed(member)] });
  },

  async run(message, args) {
    const cleanId = args[0]?.replace(/[<@!>]/g, '');
    const member = message.mentions?.members?.first?.()
      || (cleanId && /^\d{17,20}$/.test(cleanId) ? await message.guild.members.fetch(cleanId).catch(() => null) : null)
      || message.member;
    message.reply({ embeds: [buildUserEmbed(member)] });
  }
};
