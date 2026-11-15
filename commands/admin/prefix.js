const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config.js');
function getCfg() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8')); }
function saveCfg(d) { fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('prefix').setDescription('⚙️ Change server command prefix')
    .addStringOption(o => o.setName('new_prefix').setDescription('New prefix string'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const p = interaction.options.getString('new_prefix');
    const cfg = getCfg();
    if (!p) {
      return interaction.reply({ embeds: [KikiEmbed.purple('Current Prefix', `Prefix for this server is: \`${cfg.prefix || config.PREFIX}\``)] });
    }
    cfg.prefix = p;
    config.PREFIX = p;
    saveCfg(cfg);
    await interaction.reply({ embeds: [KikiEmbed.success('Prefix Updated', `Server prefix set to: \`${p}\``)] });
  },
  name: 'prefix', aliases: ['setprefix'],
  async run(message, args) {
    const p = args[0];
    const cfg = getCfg();
    if (!p) return message.reply({ embeds: [KikiEmbed.purple('Prefix', `Current: \`${cfg.prefix || config.PREFIX}\``)] });
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
    cfg.prefix = p;
    config.PREFIX = p;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Prefix Updated', `New prefix: \`${p}\``)] });
  }
};
