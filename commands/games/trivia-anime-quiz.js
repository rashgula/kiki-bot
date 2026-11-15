const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia-anime-quiz')
    .setDescription('🎮 Answer anime history and character trivia')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🎮 TRIVIA-ANIME-QUIZ',
      '**Action:** Answer anime history and character trivia\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'trivia-anime-quiz',
  aliases: ['k-trivia-anime-quiz', 'triviaanimequiz'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🎮 TRIVIA-ANIME-QUIZ',
      '**Command:** `trivia-anime-quiz`\\n' +
      '**Description:** Answer anime history and character trivia\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
