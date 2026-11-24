const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set the slowmode for a channel.')
    .addIntegerOption(opt =>
      opt.setName('seconds').setDescription('Slowmode in seconds (0 to disable, max 21600)').setRequired(true).setMinValue(0).setMaxValue(21600)
    )
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('Target channel (defaults to current)').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const seconds = interaction.options.getInteger('seconds');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.setRateLimitPerUser(seconds);
      const msg = seconds === 0
        ? `Slowmode has been **disabled** in ${channel}.`
        : `Slowmode set to **${seconds} second(s)** in ${channel}.`;
      await interaction.reply({ embeds: [KikiEmbed.success('Slowmode Updated', msg)] });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Slowmode Failed', err.message)], ephemeral: true });
    }
  },

  name: 'slowmode',
  aliases: ['slow', 'sm'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Manage Channels** permission.')] });
    }
    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply({ embeds: [KikiEmbed.error('Invalid Value', 'Please provide a value between 0 and 21600 seconds.')] });
    }
    const channel = message.mentions?.channels?.first?.() || message.channel;

    try {
      await channel.setRateLimitPerUser(seconds);
      const msg = seconds === 0
        ? `Slowmode has been **disabled** in ${channel}.`
        : `Slowmode set to **${seconds} second(s)** in ${channel}.`;
      message.reply({ embeds: [KikiEmbed.success('Slowmode Updated', msg)] });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Slowmode Failed', err.message)] });
    }
  },
};
