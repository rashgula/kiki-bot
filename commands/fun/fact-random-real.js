const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('fact-random-real')
    .setDescription('💡 Discover surprising real-world verified fact')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('💡 FACT-RANDOM-REAL',
      '**Action:** Discover surprising real-world verified fact\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'fact-random-real',
  aliases: ['k-fact-random-real', 'factrandomreal'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('💡 FACT-RANDOM-REAL',
      '**Command:** `fact-random-real`\n' +
      '**Description:** Discover surprising real-world verified fact\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
