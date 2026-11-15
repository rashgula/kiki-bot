const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  name: 'gothic-fun-66',
  aliases: ['k-gothic-fun-66', 'gothicfun66'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🎭 GOTHIC-FUN-66',
      '**Command:** `gothic-fun-66`\\n' +
      '**Description:** Gothic entertainment routine #66 for server management and automation\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
