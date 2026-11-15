const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  name: 'gothic-fun-91',
  aliases: ['k-gothic-fun-91', 'gothicfun91'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🎭 GOTHIC-FUN-91',
      '**Command:** `gothic-fun-91`\\n' +
      '**Description:** Gothic entertainment routine #91 for server management and automation\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
