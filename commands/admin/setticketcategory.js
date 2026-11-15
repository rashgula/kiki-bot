const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
function getCfg() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8')); }
function saveCfg(d) { fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('setticketcategory').setDescription('🎫 Set Category for newly created tickets')
    .addChannelOption(o => o.setName('category').setDescription('Category').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const cat = interaction.options.getChannel('category');
    const cfg = getCfg();
    cfg.ticket_category_id = cat.id;
    saveCfg(cfg);
    await interaction.reply({ embeds: [KikiEmbed.success('Ticket Category Set', `✅ New tickets will be opened under **${cat.name}**`)] });
  },
  name: 'setticketcategory', aliases: [],
  async run(message, args) {
    const id = args[0];
    if (!id) return;
    const cfg = getCfg();
    cfg.ticket_category_id = id;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Ticket Category', `Set to ${id}`)] });
  }
};
