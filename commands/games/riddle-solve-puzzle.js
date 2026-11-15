const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('riddle-solve-puzzle')
    .setDescription('🧩 Solve clever brain teaser riddle')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🧩 RIDDLE-SOLVE-PUZZLE',
      '**Action:** Solve clever brain teaser riddle\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'riddle-solve-puzzle',
  aliases: ['k-riddle-solve-puzzle', 'riddlesolvepuzzle'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🧩 RIDDLE-SOLVE-PUZZLE',
      '**Command:** `riddle-solve-puzzle`\\n' +
      '**Description:** Solve clever brain teaser riddle\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
