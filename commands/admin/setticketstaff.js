const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
function getCfg() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8')); }
function saveCfg(d) { fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('setticketstaff').setDescription('🎫 Set Ticket Staff Role')
    .addRoleOption(o => o.setName('role').setDescription('Staff role').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const cfg = getCfg();
    cfg.staff_role_id = role.id;
    saveCfg(cfg);
    await interaction.reply({ embeds: [KikiEmbed.success('Ticket Staff Set', `✅ Ticket Staff set to **@${role.name}**`)] });
  },
  name: 'setticketstaff', aliases: [],
  async run(message) {
    const role = message.mentions.roles.first();
    if (!role) return;
    const cfg = getCfg();
    cfg.staff_role_id = role.id;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Staff Role', `Set to ${role.name}`)] });
  }
};
