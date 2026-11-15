const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('hunt-forest-game')
    .setDescription('🏹 Hunt in dark woods for valuable pelts')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🏹 HUNT-FOREST-GAME',
      '**Action:** Hunt in dark woods for valuable pelts\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'hunt-forest-game',
  aliases: ['k-hunt-forest-game', 'huntforestgame'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🏹 HUNT-FOREST-GAME',
      '**Command:** `hunt-forest-game`\\n' +
      '**Description:** Hunt in dark woods for valuable pelts\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
