const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to ban').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the ban').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);

    if (member) {
      if (!member.bannable) {
        return interaction.reply({ embeds: [KikiEmbed.error('Cannot Ban', 'I do not have permission to ban this user.')], ephemeral: true });
      }
      if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
        return interaction.reply({ embeds: [KikiEmbed.error('Role Hierarchy', 'You cannot ban someone with an equal or higher role.')], ephemeral: true });
      }
    }

    try {
      await interaction.guild.members.ban(user.id, { reason });
      await interaction.reply({
        embeds: [KikiEmbed.success('Member Banned', `**${user.tag}** has been banned.\n**Reason:** ${reason}`)]
      });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Ban Failed', err.message)], ephemeral: true });
    }
  },

  name: 'ban',
  aliases: ['b'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Ban Members** permission.')] });
    }
    const target = message.mentions?.users?.first?.() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [KikiEmbed.error('Invalid User', 'Please mention a user or provide a valid ID.')] });
    const reason = args.slice((message.mentions?.users?.size || 0) ? 1 : 1).join(' ') || 'No reason provided';
    const member = message.guild.members.cache.get(target.id);

    if (member) {
      if (!member.bannable) return message.reply({ embeds: [KikiEmbed.error('Cannot Ban', 'I cannot ban this user.')] });
      if (message.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
        return message.reply({ embeds: [KikiEmbed.error('Role Hierarchy', 'You cannot ban someone with an equal or higher role.')] });
      }
    }

    try {
      await message.guild.members.ban(target.id, { reason });
      message.reply({ embeds: [KikiEmbed.success('Member Banned', `**${target.tag}** has been banned.\n**Reason:** ${reason}`)] });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Ban Failed', err.message)] });
    }
  },
};
