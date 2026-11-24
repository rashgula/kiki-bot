const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('flag-quiz-guess')
    .setDescription('🚩 Identify country matching displayed flag'),

  aliases: ['flag', 'flagquiz'],
  name: 'flag-quiz-guess',

  async execute(interaction, client) {
    const f = GamesEngine.getFlagQuiz();
    const embed = KikiEmbed.purple('🚩 Flag Quiz: What country is ' + f.flag + ' ?',
      '**Options:**\n' + f.options + '\n\n' +
      '*Click spoiler below to reveal answer:*\n' + f.answer
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const f = GamesEngine.getFlagQuiz();
    const embed = KikiEmbed.purple('🚩 Flag Quiz: What country is ' + f.flag + ' ?',
      '**Options:**\n' + f.options + '\n\n' +
      '*Click spoiler below to reveal answer:*\n' + f.answer
    );
    message.reply({ embeds: [embed] });
  }
};
