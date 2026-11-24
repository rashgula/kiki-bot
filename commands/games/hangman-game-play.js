const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hangman-game-play')
    .setDescription('🎮 Guess hidden word letters before hanging'),

  aliases: ['hangman'],
  name: 'hangman-game-play',

  async execute(interaction, client) {
    const h = GamesEngine.getHangmanPuzzle();
    const embed = KikiEmbed.purple('🎮 Gothic Hangman Challenge',
      h.stage + '\n\n' +
      '**Word:** `' + h.blanks + '`\n' +
      '💡 **Hint:** *' + h.hint + '*\n\n' +
      '*Reveal word:* ' + h.solution
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const h = GamesEngine.getHangmanPuzzle();
    const embed = KikiEmbed.purple('🎮 Gothic Hangman Challenge',
      h.stage + '\n\n' +
      '**Word:** `' + h.blanks + '`\n' +
      '💡 **Hint:** *' + h.hint + '*\n\n' +
      '*Reveal word:* ' + h.solution
    );
    message.reply({ embeds: [embed] });
  }
};
