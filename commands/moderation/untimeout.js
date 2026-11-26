const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a timeout from a member.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to remove timeout from').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) return interaction.reply({ embeds: [KikiEmbed.error('Not Found', 'That user is not in this server.')], ephemeral: true });
    if (!member.isCommunicationDisabled()) {
      return interaction.reply({ embeds: [KikiEmbed.error('Not Timed Out', `**${user.tag}** is not currently timed out.`)], ephemeral: true });
    }

    try {
      await member.timeout(null);
      await interaction.reply({
        embeds: [KikiEmbed.success('Timeout Removed', `**${user.tag}**'s timeout has been removed.`)]
      });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Untimeout Failed', err.message)], ephemeral: true });
    }
  },

  name: 'untimeout',
  aliases: ['unmute', 'uto'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Moderate Members** permission.')] });
    }
    const target = message.mentions?.members?.first?.() || (args[0] ? await message.guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [KikiEmbed.error('Invalid User', 'Please mention a member.')] });

    if (!target.isCommunicationDisabled()) {
      return message.reply({ embeds: [KikiEmbed.error('Not Timed Out', `**${target.user.tag}** is not currently timed out.`)] });
    }

    try {
      await target.timeout(null);
      message.reply({ embeds: [KikiEmbed.success('Timeout Removed', `**${target.user.tag}**'s timeout has been removed.`)] });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Untimeout Failed', err.message)] });
    }
  },
};
