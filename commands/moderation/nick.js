const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Change or reset a member\'s nickname.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to nickname').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('nickname').setDescription('New nickname (leave empty to reset)').setRequired(false).setMaxLength(32)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const nickname = interaction.options.getString('nickname') || null;
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) return interaction.reply({ embeds: [KikiEmbed.error('Not Found', 'That user is not in this server.')], ephemeral: true });
    if (!member.manageable) return interaction.reply({ embeds: [KikiEmbed.error('Cannot Manage', 'I cannot manage this member\'s nickname.')], ephemeral: true });

    try {
      await member.setNickname(nickname, `Changed by ${interaction.user.tag}`);
      const msg = nickname
        ? `**${user.tag}**'s nickname has been set to **${nickname}**.`
        : `**${user.tag}**'s nickname has been reset.`;
      await interaction.reply({ embeds: [KikiEmbed.success('Nickname Updated', msg)] });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Nick Failed', err.message)], ephemeral: true });
    }
  },

  name: 'nick',
  aliases: ['nickname', 'setnick'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Manage Nicknames** permission.')] });
    }
    const target = message.mentions?.members?.first?.() || (args[0] ? await message.guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [KikiEmbed.error('Invalid User', 'Please mention a member.')] });
    if (!target.manageable) return message.reply({ embeds: [KikiEmbed.error('Cannot Manage', 'I cannot manage this member\'s nickname.')] });

    const nickname = args.slice(1).join(' ') || null;

    try {
      await target.setNickname(nickname, `Changed by ${message.author.tag}`);
      const msg = nickname
        ? `**${target.user.tag}**'s nickname set to **${nickname}**.`
        : `**${target.user.tag}**'s nickname has been reset.`;
      message.reply({ embeds: [KikiEmbed.success('Nickname Updated', msg)] });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Nick Failed', err.message)] });
    }
  },
};
