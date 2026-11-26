const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setleave')
    .setDescription('🚪 Leave & Goodbye announcement channel set karo')
    .addChannelOption(o => o.setName('channel').setDescription('Leave channel').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf Server Owner aur Whitelisted members Leave channel set kar sakte hain!')],
        ephemeral: true
      });
    }

    const ch = interaction.options.getChannel('channel');
    const cfg = KIKI.loadConfig();
    if (!cfg.guilds) cfg.guilds = {};
    if (!cfg.guilds[interaction.guildId]) cfg.guilds[interaction.guildId] = {};
    cfg.guilds[interaction.guildId].leave_channel_id = ch.id;
    cfg.guilds[interaction.guildId].leave_enabled = true;
    if (!cfg.leave_channel_id) cfg.leave_channel_id = ch.id;
    KIKI.saveConfig(cfg);

    await interaction.reply({
      embeds: [KikiEmbed.success('Leave Channel Set 🚪', `✅ Member Leave & Goodbye announcements ab ${ch.toString()} me aayenge!`)]
    });
  },

  name: 'setleave',
  aliases: ['leavechannel', 'setgoodbye', 'leavech'],
  async run(message, args, client) {
    if (!KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({ embeds: [KikiEmbed.error('Permission Denied', 'Aapke paas **Administrator** permission honi chahiye!')] });
    }

    const ch = message.mentions?.channels?.first?.() || (args[0] ? message.guild.channels.cache.get(args[0].replace(/[<#>]/g, '')) : null);
    if (!ch) {
      // If no channel given, redirect directly to interactive leave panel
      const leavePanel = require('./leavepanel.js');
      return await leavePanel.run(message, args, client);
    }

    const cfg = KIKI.loadConfig();
    if (!cfg.guilds) cfg.guilds = {};
    if (!cfg.guilds[message.guild.id]) cfg.guilds[message.guild.id] = {};
    cfg.guilds[message.guild.id].leave_channel_id = ch.id;
    cfg.guilds[message.guild.id].leave_enabled = true;
    if (!cfg.leave_channel_id) cfg.leave_channel_id = ch.id;
    KIKI.saveConfig(cfg);

    message.reply({ embeds: [KikiEmbed.success('Leave Channel Set 🚪', `✅ Member Leave announcements ab ${ch.toString()} me aayenge!\n\n💡 Panel dekhne ke liye type karein: \`&leavepanel\``)] });
  }
};
