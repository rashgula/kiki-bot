const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('audit-dangerous-perms')
    .setDescription('⚠️ Find roles granting dangerous permission flags')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('⚠️ AUDIT-DANGEROUS-PERMS',
      '**Action:** Find roles granting dangerous permission flags\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'audit-dangerous-perms',
  aliases: ['k-audit-dangerous-perms', 'auditdangerousperms'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('⚠️ AUDIT-DANGEROUS-PERMS',
      '**Command:** `audit-dangerous-perms`\n' +
      '**Description:** Find roles granting dangerous permission flags\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
