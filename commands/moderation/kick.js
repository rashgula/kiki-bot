const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to kick').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the kick').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) return interaction.reply({ embeds: [KikiEmbed.error('Not Found', 'That user is not in this server.')], ephemeral: true });
    if (!member.kickable) return interaction.reply({ embeds: [KikiEmbed.error('Cannot Kick', 'I do not have permission to kick this user.')], ephemeral: true });
    if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
      return interaction.reply({ embeds: [KikiEmbed.error('Role Hierarchy', 'You cannot kick someone with an equal or higher role.')], ephemeral: true });
    }

    try {
      await member.kick(reason);
      await interaction.reply({
        embeds: [KikiEmbed.success('Member Kicked', `**${user.tag}** has been kicked.\n**Reason:** ${reason}`)]
      });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Kick Failed', err.message)], ephemeral: true });
    }
  },

  name: 'kick',
  aliases: ['k'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Kick Members** permission.')] });
    }
    const target = message.mentions?.members?.first?.() || (args[0] ? await message.guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [KikiEmbed.error('Invalid User', 'Please mention a member to kick.')] });
    const reason = args.slice(1).join(' ') || 'No reason provided';

    if (!target.kickable) return message.reply({ embeds: [KikiEmbed.error('Cannot Kick', 'I cannot kick this user.')] });
    if (message.member.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
      return message.reply({ embeds: [KikiEmbed.error('Role Hierarchy', 'You cannot kick someone with an equal or higher role.')] });
    }

    try {
      await target.kick(reason);
      message.reply({ embeds: [KikiEmbed.success('Member Kicked', `**${target.user.tag}** has been kicked.\n**Reason:** ${reason}`)] });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Kick Failed', err.message)] });
    }
  },
};
