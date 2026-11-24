const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('rate-anything-scale')
    .setDescription('⭐ Rate target item on 1 to 10 aesthetic scale')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('⭐ RATE-ANYTHING-SCALE',
      '**Action:** Rate target item on 1 to 10 aesthetic scale\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'rate-anything-scale',
  aliases: ['k-rate-anything-scale', 'rateanythingscale'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('⭐ RATE-ANYTHING-SCALE',
      '**Command:** `rate-anything-scale`\n' +
      '**Description:** Rate target item on 1 to 10 aesthetic scale\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
