const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a channel, allowing @everyone to send messages.')
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('Channel to unlock (defaults to current)').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null,
        SendMessagesInThreads: null,
      });
      await interaction.reply({ embeds: [KikiEmbed.success('🔓 Channel Unlocked', `${channel} has been unlocked. Members can send messages again.`)] });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Unlock Failed', err.message)], ephemeral: true });
    }
  },

  name: 'unlock',
  aliases: [],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Manage Channels** permission.')] });
    }
    const channel = message.mentions.channels.first() || message.channel;
    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null,
        SendMessagesInThreads: null,
      });
      message.reply({ embeds: [KikiEmbed.success('🔓 Channel Unlocked', `${channel} has been unlocked.`)] });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Unlock Failed', err.message)] });
    }
  },
};
