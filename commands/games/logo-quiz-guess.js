const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logo-quiz-guess')
    .setDescription('🏢 Identify brand matching displayed logo & clue'),

  aliases: ['logo', 'logoquiz'],
  name: 'logo-quiz-guess',

  async execute(interaction, client) {
    const l = GamesEngine.getLogoQuiz();
    const embed = KikiEmbed.purple('🏢 Brand / Logo Quiz ' + l.emoji,
      '**Clue:** *' + l.hint + '*\n\n' +
      '**Options:**\n' + l.options + '\n\n' +
      '*Reveal brand:* ' + l.answer
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const l = GamesEngine.getLogoQuiz();
    const embed = KikiEmbed.purple('🏢 Brand / Logo Quiz ' + l.emoji,
      '**Clue:** *' + l.hint + '*\n\n' +
      '**Options:**\n' + l.options + '\n\n' +
      '*Reveal brand:* ' + l.answer
    );
    message.reply({ embeds: [embed] });
  }
};
