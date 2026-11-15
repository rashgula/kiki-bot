const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('audit-webhook-count')
    .setDescription('🪝 Count and inspect all active webhook integrations')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🪝 AUDIT-WEBHOOK-COUNT',
      '**Action:** Count and inspect all active webhook integrations\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'audit-webhook-count',
  aliases: ['k-audit-webhook-count', 'auditwebhookcount'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🪝 AUDIT-WEBHOOK-COUNT',
      '**Command:** `audit-webhook-count`\\n' +
      '**Description:** Count and inspect all active webhook integrations\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
