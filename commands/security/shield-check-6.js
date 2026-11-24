const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  name: 'shield-check-6',
  aliases: ['k-shield-check-6', 'shieldcheck6'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🛡️ SHIELD-CHECK-6',
      '**Command:** `shield-check-6`\n' +
      '**Description:** Security scanner routine #6 for server management and automation\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
