const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hackban')
    .setDescription('Ban a user who is not in the server by their ID.')
    .addStringOption(opt =>
      opt.setName('user_id').setDescription('The user ID to ban').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the ban').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!/^\d{17,19}$/.test(userId)) {
      return interaction.reply({ embeds: [KikiEmbed.error('Invalid ID', 'Please provide a valid Discord user ID.')], ephemeral: true });
    }

    const existing = interaction.guild.members.cache.get(userId);
    if (existing) {
      return interaction.reply({ embeds: [KikiEmbed.error('User In Server', 'This user is already in the server. Use `/ban` instead.')], ephemeral: true });
    }

    try {
      await interaction.guild.members.ban(userId, { reason });
      const user = await client.users.fetch(userId).catch(() => null);
      await interaction.reply({
        embeds: [KikiEmbed.success('User Hackbanned',
          `**${user ? user.tag : userId}** has been banned (they were not in the server).\n**Reason:** ${reason}`
        )]
      });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Hackban Failed', err.message)], ephemeral: true });
    }
  },

  name: 'hackban',
  aliases: ['forceban', 'idban'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Ban Members** permission.')] });
    }
    const userId = args[0];
    if (!userId || !/^\d{17,19}$/.test(userId)) {
      return message.reply({ embeds: [KikiEmbed.error('Invalid ID', 'Please provide a valid Discord user ID.')] });
    }
    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await message.guild.members.ban(userId, { reason });
      const user = await client.users.fetch(userId).catch(() => null);
      message.reply({
        embeds: [KikiEmbed.success('User Hackbanned',
          `**${user ? user.tag : userId}** has been banned.\n**Reason:** ${reason}`
        )]
      });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Hackban Failed', err.message)] });
    }
  },
};
