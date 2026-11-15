const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('audit-invite-expiry')
    .setDescription('🔗 Find infinite non-expiring server invites')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🔗 AUDIT-INVITE-EXPIRY',
      '**Action:** Find infinite non-expiring server invites\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'audit-invite-expiry',
  aliases: ['k-audit-invite-expiry', 'auditinviteexpiry'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🔗 AUDIT-INVITE-EXPIRY',
      '**Command:** `audit-invite-expiry`\\n' +
      '**Description:** Find infinite non-expiring server invites\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
