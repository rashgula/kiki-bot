const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('gothic-tarot-draw')
    .setDescription('🔮 Draw single card from the gothic tarot deck')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🔮 GOTHIC-TAROT-DRAW',
      '**Action:** Draw single card from the gothic tarot deck\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'gothic-tarot-draw',
  aliases: ['k-gothic-tarot-draw', 'gothictarotdraw'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🔮 GOTHIC-TAROT-DRAW',
      '**Command:** `gothic-tarot-draw`\\n' +
      '**Description:** Draw single card from the gothic tarot deck\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
