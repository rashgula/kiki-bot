const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('connect4-challenge')
    .setDescription('🔴 Play 4-in-a-row checkers game against a friend')
    .addUserOption(o => o.setName('opponent').setDescription('Member to challenge')),

  aliases: ['connect4', 'c4'],
  name: 'connect4-challenge',

  async execute(interaction, client) {
    const opp = interaction.options.getUser('opponent') || { username: 'KIKI Shadow AI' };
    const res = GamesEngine.playConnect4(interaction.user.username, opp.username);
    const embed = KikiEmbed.purple('🔴 Connect 4: ' + res.p1 + ' vs ' + res.p2,
      '**Board State:**\n' + res.board + '\n\n' +
      '🏆 **Winner:** **' + res.winner + '** with ' + res.winningPiece + ' 4-in-a-row!\n' +
      '*Drop discs using column numbers 1-7 in live challenges!*'
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const opp = message.mentions?.users?.first?.() || { username: 'KIKI Shadow AI' };
    const res = GamesEngine.playConnect4(message.author.username, opp.username);
    const embed = KikiEmbed.purple('🔴 Connect 4: ' + res.p1 + ' vs ' + res.p2,
      '**Board State:**\n' + res.board + '\n\n' +
      '🏆 **Winner:** **' + res.winner + '** with ' + res.winningPiece + ' 4-in-a-row!\n' +
      '*Drop discs using column numbers 1-7 in live challenges!*'
    );
    message.reply({ embeds: [embed] });
  }
};
