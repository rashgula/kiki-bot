const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  name: 'gothic-fun-85',
  aliases: ['k-gothic-fun-85', 'gothicfun85'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🎭 GOTHIC-FUN-85',
      '**Command:** `gothic-fun-85`\\n' +
      '**Description:** Gothic entertainment routine #85 for server management and automation\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
