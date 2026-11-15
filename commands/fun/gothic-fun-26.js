const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  name: 'gothic-fun-26',
  aliases: ['k-gothic-fun-26', 'gothicfun26'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🎭 GOTHIC-FUN-26',
      '**Command:** `gothic-fun-26`\\n' +
      '**Description:** Gothic entertainment routine #26 for server management and automation\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
