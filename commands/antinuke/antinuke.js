const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antinuke')
    .setDescription('🛡️ KIKI Anti-Nuke security system configure karo (Owner Only)')
    .addSubcommand(sub => sub.setName('master').setDescription('Activate Master Anti-Nuke (All 16+ shields ON)'))
    .addSubcommand(sub => sub.setName('enable').setDescription('Turn Anti-Nuke ON'))
    .addSubcommand(sub => sub.setName('disable').setDescription('Turn Anti-Nuke OFF'))
    .addSubcommand(sub => sub.setName('status').setDescription('View current Anti-Nuke status'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Ownership Required 👑', 'Sirf **Server Owner** ya **Bot Owner** hi Anti-Nuke ko ON / OFF kar sakte hain!\nKisi aur ke paas ye permission nahi hai.')],
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    const masterCmd = require('./master-antinuke.js');

    if (sub === 'master') {
      return masterCmd.execute(interaction, client);
    }

    const cfg = KIKI.loadConfig();

    if (sub === 'enable') {
      cfg.antinuke = true;
      cfg.master_antinuke = true;
      KIKI.saveConfig(cfg);
      const embed = KikiEmbed.purple('Anti-Nuke Shield Active 🛡️', '✅ **Anti-Nuke successfully ENABLED!**\nServer is now protected under KIKI Gothic Shield.');
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'disable') {
      cfg.antinuke = false;
      cfg.master_antinuke = false;
      KIKI.saveConfig(cfg);
      const embed = KikiEmbed.warn('Anti-Nuke Deactivated', '⚠️ **Anti-Nuke has been DISABLED!**\nServer security shields paused.');
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'status') {
      return masterCmd.execute(interaction, client);
    }
  },

  name: 'antinuke',
  aliases: ['an', 'security'],
  async run(message, args, client) {
    if (!KIKI.isServerOrBotOwner(message.guild, message.author.id)) {
      return message.reply({
        embeds: [KikiEmbed.error('Ownership Required 👑', 'Sirf **Server Owner** ya **Bot Owner** hi Anti-Nuke ko ON / OFF kar sakte hain!\nKisi aur ke paas ye permission nahi hai.')]
      });
    }

    const action = args[0]?.toLowerCase();
    const masterCmd = require('./master-antinuke.js');

    if (action === 'master') {
      return masterCmd.run(message, args.slice(1), client);
    }

    const cfg = KIKI.loadConfig();
    if (action === 'enable' || action === 'on') {
      cfg.antinuke = true;
      cfg.master_antinuke = true;
      KIKI.saveConfig(cfg);
      return message.reply({ embeds: [KikiEmbed.purple('Anti-Nuke Activated 🛡️', '✅ Anti-Nuke ENABLED! Use `&master-antinuke` for full control dashboard.')] });
    } else if (action === 'disable' || action === 'off') {
      cfg.antinuke = false;
      cfg.master_antinuke = false;
      KIKI.saveConfig(cfg);
      return message.reply({ embeds: [KikiEmbed.warn('Anti-Nuke Disabled', '⚠️ Anti-Nuke DISABLED!\nServer security paused.')] });
    }

    return masterCmd.run(message, args, client);
  }
};
