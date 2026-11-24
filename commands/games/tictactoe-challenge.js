const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tictactoe-challenge')
    .setDescription('❌ Play 3x3 tic tac toe game against friend or bot')
    .addUserOption(o => o.setName('opponent').setDescription('Member to play with')),

  aliases: ['tictactoe', 'ttt'],
  name: 'tictactoe-challenge',

  async execute(interaction, client) {
    const opp = interaction.options.getUser('opponent') || { username: 'KIKI Shadow AI' };
    const res = GamesEngine.playTicTacToe(interaction.user.username, opp.username);
    const embed = KikiEmbed.purple('❌ Tic-Tac-Toe: ' + res.p1 + ' vs ' + res.p2,
      '**Final Board:**\n' + res.grid + '\n\n' +
      (res.winner === 'Tie Game' ? '🤝 **Match Result:** It\'s a Draw!' : '🏆 **Winner:** **' + res.winner + '** (' + res.symbol + ')!')
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const opp = (message.mentions?.users?.first ? message.mentions.users.first() : null) || { username: 'KIKI Shadow AI' };
    const res = GamesEngine.playTicTacToe(message.author.username, opp.username);
    const embed = KikiEmbed.purple('❌ Tic-Tac-Toe: ' + res.p1 + ' vs ' + res.p2,
      '**Final Board:**\n' + res.grid + '\n\n' +
      (res.winner === 'Tie Game' ? '🤝 **Match Result:** It\'s a Draw!' : '🏆 **Winner:** **' + res.winner + '** (' + res.symbol + ')!')
    );
    message.reply({ embeds: [embed] });
  }
};
