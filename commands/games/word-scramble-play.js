const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('word-scramble-play')
    .setDescription('🎮 Unscramble mixed letters to find the word'),

  aliases: ['scramble', 'wordscramble'],
  name: 'word-scramble-play',

  async execute(interaction, client) {
    const w = GamesEngine.getWordScramble();
    const embed = KikiEmbed.purple('🔤 Word Scramble Challenge',
      '**Scrambled Letters:**\n`' + w.scrambled + '`\n\n' +
      '💡 **Hint:** *' + w.hint + '*\n\n' +
      '*Reveal unscrambled word:* ' + w.solution
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const w = GamesEngine.getWordScramble();
    const embed = KikiEmbed.purple('🔤 Word Scramble Challenge',
      '**Scrambled Letters:**\n`' + w.scrambled + '`\n\n' +
      '💡 **Hint:** *' + w.hint + '*\n\n' +
      '*Reveal unscrambled word:* ' + w.solution
    );
    message.reply({ embeds: [embed] });
  }
};
