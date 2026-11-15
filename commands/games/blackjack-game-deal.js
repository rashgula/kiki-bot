const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack-game-deal')
    .setDescription('🃏 Play hand of 21 blackjack against dealer')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🃏 BLACKJACK-GAME-DEAL',
      '**Action:** Play hand of 21 blackjack against dealer\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'blackjack-game-deal',
  aliases: ['k-blackjack-game-deal', 'blackjackgamedeal'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🃏 BLACKJACK-GAME-DEAL',
      '**Command:** `blackjack-game-deal`\\n' +
      '**Description:** Play hand of 21 blackjack against dealer\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
