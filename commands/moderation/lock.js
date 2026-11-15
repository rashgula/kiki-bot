const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel, preventing @everyone from sending messages.')
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('Channel to lock (defaults to current)').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false,
        SendMessagesInThreads: false,
      });
      await interaction.reply({ embeds: [KikiEmbed.success('🔒 Channel Locked', `${channel} has been locked. Members can no longer send messages.`)] });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Lock Failed', err.message)], ephemeral: true });
    }
  },

  name: 'lock',
  aliases: [],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Manage Channels** permission.')] });
    }
    const channel = message.mentions.channels.first() || message.channel;
    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false,
        SendMessagesInThreads: false,
      });
      message.reply({ embeds: [KikiEmbed.success('🔒 Channel Locked', `${channel} has been locked.`)] });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Lock Failed', err.message)] });
    }
  },
};
