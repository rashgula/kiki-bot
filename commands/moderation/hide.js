const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hide')
    .setDescription('Hide a channel from @everyone.')
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('Channel to hide (defaults to current)').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        ViewChannel: false,
      });
      await interaction.reply({ embeds: [KikiEmbed.success('👁️ Channel Hidden', `${channel} is now hidden from @everyone.`)] });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Hide Failed', err.message)], ephemeral: true });
    }
  },

  name: 'hide',
  aliases: [],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Manage Channels** permission.')] });
    }
    const channel = message.mentions.channels.first() || message.channel;
    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: false });
      message.reply({ embeds: [KikiEmbed.success('👁️ Channel Hidden', `${channel} is now hidden from @everyone.`)] });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Hide Failed', err.message)] });
    }
  },
};
