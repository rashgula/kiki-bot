const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log-channel-messages')
    .setDescription('📜 Set message edit and delete log destination')
    .addChannelOption(o => o.setName('channel').setDescription('Chat log channel').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const ch = interaction.options.getChannel('channel') || interaction.channel;
    const cfg = KIKI.loadConfig();
    cfg.chat_log_channel_id = ch.id;
    KIKI.saveConfig(cfg);

    const embed = KikiEmbed.success(
      'Chat Log Channel Configured',
      `✅ Chat logs (Message Delete & Edit) will now be sent in ${ch.toString()}`
    );
    await interaction.reply({ embeds: [embed] });
  },

  name: 'log-channel-messages',
  aliases: ['k-log-channel-messages', 'logchannelmessages', 'setchatlog'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator) && !KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({ embeds: [KikiEmbed.error('Permission Denied', 'Aapke paas **Administrator** permission honi chahiye!')] });
    }

    const ch = message.mentions.channels.first() || (args[0] ? message.guild.channels.cache.get(args[0]) : null) || message.channel;
    const cfg = KIKI.loadConfig();
    cfg.chat_log_channel_id = ch.id;
    KIKI.saveConfig(cfg);

    const embed = KikiEmbed.success(
      'Chat Log Channel Configured',
      `✅ Chat logs will now be delivered to ${ch.toString()}`
    );
    message.reply({ embeds: [embed] });
  }
};
