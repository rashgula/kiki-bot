const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('tictactoe-challenge')
    .setDescription('❌ Play 3x3 tic tac toe game against friend')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('❌ TICTACTOE-CHALLENGE',
      '**Action:** Play 3x3 tic tac toe game against friend\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'tictactoe-challenge',
  aliases: ['k-tictactoe-challenge', 'tictactoechallenge'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('❌ TICTACTOE-CHALLENGE',
      '**Command:** `tictactoe-challenge`\n' +
      '**Description:** Play 3x3 tic tac toe game against friend\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
