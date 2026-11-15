const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');

function getCfg() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8'));
}
function saveCfg(d) {
  fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setleave')
    .setDescription('🚪 Leave log channel set karo')
    .addChannelOption(o => o.setName('channel').setDescription('Leave channel').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const ch = interaction.options.getChannel('channel');
    const cfg = getCfg();
    cfg.leave_channel_id = ch.id;
    saveCfg(cfg);
    await interaction.reply({
      embeds: [KikiEmbed.success('Leave Channel Set', `✅ Leave / goodbye records will now be sent in ${ch.toString()}`)]
    });
  },

  name: 'setleave',
  aliases: ['leavechannel', 'setgoodbye'],
  async run(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ embeds: [KikiEmbed.error('Permission Denied', 'Aapke paas **Administrator** permission honi chahiye!')] });
    }
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply('Channel mention karo! Jaise: `&setleave #leave-logs`');
    const cfg = getCfg();
    cfg.leave_channel_id = ch.id;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Leave Channel Set', `✅ Leave channel set to ${ch.toString()}`)] });
  }
};
