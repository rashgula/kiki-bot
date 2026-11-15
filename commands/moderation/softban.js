const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Softban a member (ban + immediate unban to delete messages).')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to softban').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the softban').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);

    if (member) {
      if (!member.bannable) return interaction.reply({ embeds: [KikiEmbed.error('Cannot Softban', 'I cannot ban this user.')], ephemeral: true });
      if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
        return interaction.reply({ embeds: [KikiEmbed.error('Role Hierarchy', 'You cannot softban someone with an equal or higher role.')], ephemeral: true });
      }
    }

    try {
      await interaction.guild.members.ban(user.id, { deleteMessageSeconds: 7 * 24 * 60 * 60, reason });
      await interaction.guild.members.unban(user.id, 'Softban - immediate unban');
      await interaction.reply({
        embeds: [KikiEmbed.success('Member Softbanned',
          `**${user.tag}** has been softbanned (kicked and messages deleted).\n**Reason:** ${reason}`
        )]
      });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Softban Failed', err.message)], ephemeral: true });
    }
  },

  name: 'softban',
  aliases: ['sb'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Ban Members** permission.')] });
    }
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [KikiEmbed.error('Invalid User', 'Please mention a user to softban.')] });
    const reason = args.slice(1).join(' ') || 'No reason provided';
    const member = message.guild.members.cache.get(target.id);

    if (member) {
      if (!member.bannable) return message.reply({ embeds: [KikiEmbed.error('Cannot Softban', 'I cannot ban this user.')] });
      if (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
        return message.reply({ embeds: [KikiEmbed.error('Role Hierarchy', 'You cannot softban someone with an equal or higher role.')] });
      }
    }

    try {
      await message.guild.members.ban(target.id, { deleteMessageSeconds: 7 * 24 * 60 * 60, reason });
      await message.guild.members.unban(target.id, 'Softban - immediate unban');
      message.reply({
        embeds: [KikiEmbed.success('Member Softbanned',
          `**${target.tag}** has been softbanned.\n**Reason:** ${reason}`
        )]
      });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Softban Failed', err.message)] });
    }
  },
};
