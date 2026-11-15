const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
function getCfg() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8')); }
function saveCfg(d) { fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('setlog').setDescription('📜 Set moderation and audit log channel')
    .addChannelOption(o => o.setName('channel').setDescription('Log channel').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const ch = interaction.options.getChannel('channel');
    const cfg = getCfg();
    cfg.log_channel_id = ch.id;
    saveCfg(cfg);
    await interaction.reply({ embeds: [KikiEmbed.success('Log Channel Configured', `✅ Audit logs will be delivered to ${ch.toString()}`)] });
  },
  name: 'setlog', aliases: ['modlog-set'],
  async run(message) {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply('Channel mention karo!');
    const cfg = getCfg();
    cfg.log_channel_id = ch.id;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Log Channel', `Set to ${ch.toString()}`)] });
  }
};
