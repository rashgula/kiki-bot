const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
function getCfg() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8')); }
function saveCfg(d) { fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('setautorole').setDescription('🏷️ Automatic join role set karo')
    .addRoleOption(o => o.setName('role').setDescription('Role given on join').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const cfg = getCfg();
    cfg.autorole_id = role.id;
    saveCfg(cfg);
    await interaction.reply({ embeds: [KikiEmbed.success('Auto-Role Set', `✅ New members will automatically receive **@${role.name}**`)] });
  },
  name: 'setautorole', aliases: ['autorole-set'],
  async run(message) {
    const role = message.mentions.roles.first();
    if (!role) return message.reply('Role mention karo!');
    const cfg = getCfg();
    cfg.autorole_id = role.id;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Auto-Role', `Set to ${role.name}`)] });
  }
};
