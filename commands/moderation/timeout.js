const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member for a specified duration.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to timeout').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('duration_minutes').setDescription('Duration in minutes (1-40320)').setRequired(true).setMinValue(1).setMaxValue(40320)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the timeout').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const durationMinutes = interaction.options.getInteger('duration_minutes');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) return interaction.reply({ embeds: [KikiEmbed.error('Not Found', 'That user is not in this server.')], ephemeral: true });
    if (!member.moderatable) return interaction.reply({ embeds: [KikiEmbed.error('Cannot Timeout', 'I cannot timeout this user.')], ephemeral: true });
    if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
      return interaction.reply({ embeds: [KikiEmbed.error('Role Hierarchy', 'You cannot timeout someone with an equal or higher role.')], ephemeral: true });
    }

    const durationMs = durationMinutes * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs);

    try {
      await member.timeout(durationMs, reason);
      await interaction.reply({
        embeds: [KikiEmbed.success('Member Timed Out',
          `**${user.tag}** has been timed out for **${durationMinutes} minute(s)**.\n**Reason:** ${reason}\n**Expires:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`
        )]
      });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Timeout Failed', err.message)], ephemeral: true });
    }
  },

  name: 'timeout',
  aliases: ['mute', 'to'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Moderate Members** permission.')] });
    }
    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [KikiEmbed.error('Invalid User', 'Please mention a member to timeout.')] });
    const durationMinutes = parseInt(args[1]);
    if (isNaN(durationMinutes) || durationMinutes < 1 || durationMinutes > 40320) {
      return message.reply({ embeds: [KikiEmbed.error('Invalid Duration', 'Please provide a valid duration in minutes (1-40320).')] });
    }
    const reason = args.slice(2).join(' ') || 'No reason provided';

    if (!target.moderatable) return message.reply({ embeds: [KikiEmbed.error('Cannot Timeout', 'I cannot timeout this user.')] });
    if (message.member.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
      return message.reply({ embeds: [KikiEmbed.error('Role Hierarchy', 'You cannot timeout someone with an equal or higher role.')] });
    }

    const durationMs = durationMinutes * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs);

    try {
      await target.timeout(durationMs, reason);
      message.reply({
        embeds: [KikiEmbed.success('Member Timed Out',
          `**${target.user.tag}** has been timed out for **${durationMinutes} minute(s)**.\n**Reason:** ${reason}\n**Expires:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`
        )]
      });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Timeout Failed', err.message)] });
    }
  },
};
