const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder().setName('setlog').setDescription('📜 Set moderation and audit log channel')
    .addChannelOption(o => o.setName('channel').setDescription('Log channel').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, interaction.client) && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [KikiEmbed.error('Access Denied', 'Administrator permission chahiye!')], ephemeral: true });
    }
    const ch = interaction.options.getChannel('channel');
    KIKI.setGuildConfig(interaction.guild.id, 'log_channel_id', ch.id);
    await interaction.reply({ embeds: [KikiEmbed.success('Log Channel Configured', `✅ Audit logs will be delivered to ${ch.toString()}`)] });
  },
  name: 'setlog', aliases: ['modlog-set'],
  async run(message, args, client) {
    if (!KIKI.isSafe(message.guild, message.author.id, client) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ embeds: [KikiEmbed.error('Access Denied', 'Aapke paas Administrator permission honi chahiye!')] });
    }
    const ch = message.mentions?.channels?.first?.() || (args[0] ? message.guild.channels.cache.get(args[0].replace(/[<#>]/g, '')) : null);
    if (!ch) return message.reply({ embeds: [KikiEmbed.warn('Channel Missing', 'Kripya channel mention ya ID dein!')] });
    KIKI.setGuildConfig(message.guild.id, 'log_channel_id', ch.id);
    message.reply({ embeds: [KikiEmbed.success('Log Channel', `Set to ${ch.toString()}`)] });
  }
};
