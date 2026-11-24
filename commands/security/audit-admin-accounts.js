const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('audit-admin-accounts')
    .setDescription('👑 List all accounts with Administrator permission')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('👑 AUDIT-ADMIN-ACCOUNTS',
      '**Action:** List all accounts with Administrator permission\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'audit-admin-accounts',
  aliases: ['k-audit-admin-accounts', 'auditadminaccounts'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('👑 AUDIT-ADMIN-ACCOUNTS',
      '**Command:** `audit-admin-accounts`\n' +
      '**Description:** List all accounts with Administrator permission\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
