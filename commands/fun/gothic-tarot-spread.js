const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('gothic-tarot-spread')
    .setDescription('🔮 Draw 3-card past present future tarot spread')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🔮 GOTHIC-TAROT-SPREAD',
      '**Action:** Draw 3-card past present future tarot spread\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'gothic-tarot-spread',
  aliases: ['k-gothic-tarot-spread', 'gothictarotspread'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🔮 GOTHIC-TAROT-SPREAD',
      '**Command:** `gothic-tarot-spread`\\n' +
      '**Description:** Draw 3-card past present future tarot spread\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
