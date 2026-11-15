const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by their ID.')
    .addStringOption(opt =>
      opt.setName('user_id').setDescription('The user ID to unban').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the unban').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      const banInfo = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!banInfo) {
        return interaction.reply({ embeds: [KikiEmbed.error('Not Banned', `No ban found for ID \`${userId}\`.`)], ephemeral: true });
      }
      await interaction.guild.members.unban(userId, reason);
      await interaction.reply({
        embeds: [KikiEmbed.success('User Unbanned', `**${banInfo.user.tag}** has been unbanned.\n**Reason:** ${reason}`)]
      });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Unban Failed', err.message)], ephemeral: true });
    }
  },

  name: 'unban',
  aliases: [],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Ban Members** permission.')] });
    }
    const userId = args[0];
    if (!userId) return message.reply({ embeds: [KikiEmbed.error('Missing ID', 'Please provide a user ID to unban.')] });
    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const banInfo = await message.guild.bans.fetch(userId).catch(() => null);
      if (!banInfo) return message.reply({ embeds: [KikiEmbed.error('Not Banned', `No ban found for ID \`${userId}\`.`)] });
      await message.guild.members.unban(userId, reason);
      message.reply({ embeds: [KikiEmbed.success('User Unbanned', `**${banInfo.user.tag}** has been unbanned.\n**Reason:** ${reason}`)] });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Unban Failed', err.message)] });
    }
  },
};
