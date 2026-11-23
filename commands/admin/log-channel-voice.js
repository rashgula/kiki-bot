const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log-channel-voice')
    .setDescription('📜 Set voice connect and disconnect log channel')
    .addChannelOption(o => o.setName('channel').setDescription('Voice log channel').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const ch = interaction.options.getChannel('channel') || interaction.channel;
    const cfg = KIKI.loadConfig();
    if (!cfg.guilds) cfg.guilds = {};
    if (!cfg.guilds[interaction.guildId]) cfg.guilds[interaction.guildId] = {};
    cfg.guilds[interaction.guildId].voice_log_channel_id = ch.id;
    if (!cfg.voice_log_channel_id) cfg.voice_log_channel_id = ch.id;
    KIKI.saveConfig(cfg);

    const embed = KikiEmbed.success(
      'Voice Log Channel Configured',
      `✅ Voice logs (Join/Leave/Move/Mute) will now be sent in ${ch.toString()}`
    );
    await interaction.reply({ embeds: [embed] });
  },

  name: 'log-channel-voice',
  aliases: ['k-log-channel-voice', 'logchannelvoice', 'setvoicelog'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator) && !KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({ embeds: [KikiEmbed.error('Permission Denied', 'Aapke paas **Administrator** permission honi chahiye!')] });
    }

    const ch = message.mentions.channels.first() || (args[0] ? message.guild.channels.cache.get(args[0]) : null) || message.channel;
    const cfg = KIKI.loadConfig();
    if (!cfg.guilds) cfg.guilds = {};
    if (!cfg.guilds[message.guild.id]) cfg.guilds[message.guild.id] = {};
    cfg.guilds[message.guild.id].voice_log_channel_id = ch.id;
    if (!cfg.voice_log_channel_id) cfg.voice_log_channel_id = ch.id;
    KIKI.saveConfig(cfg);

    const embed = KikiEmbed.success(
      'Voice Log Channel Configured',
      `✅ Voice logs will now be delivered to ${ch.toString()}`
    );
    message.reply({ embeds: [embed] });
  }
};
