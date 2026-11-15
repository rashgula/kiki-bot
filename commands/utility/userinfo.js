const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('userinfo').setDescription('👤 Detailed user information')
    .addUserOption(o => o.setName('user').setDescription('Target user')),
  async execute(interaction) {
    const member = interaction.options.getMember('user') || interaction.member;
    const user = member.user;
    const roles = member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).slice(0, 15);
    const embed = KikiEmbed.purple(`User Info - ${user.tag}`, `ID: \`${user.id}\``)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '📅 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: '📆 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '🤖 Is Bot', value: user.bot ? 'Yes' : 'No', inline: true },
        { name: `🏷️ Roles (${member.roles.cache.size - 1})`, value: roles.length ? roles.join(' ') : 'None', inline: false }
      );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'userinfo', aliases: ['ui', 'whois'],
  async run(message, args) {
    const member = message.mentions.members.first() || message.member;
    const user = member.user;
    const embed = KikiEmbed.purple(`User Info - ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Joined', value: member.joinedAt.toDateString(), inline: true }
      );
    message.reply({ embeds: [embed] });
  }
};
