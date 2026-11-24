const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack-game-deal')
    .setDescription('🃏 Play 21 Blackjack against the gothic dealer')
    .addIntegerOption(o => o.setName('bet').setDescription('Coins to bet')),

  aliases: ['blackjack', 'bj', '21'],
  name: 'blackjack-game-deal',

  async execute(interaction, client) {
    const bet = interaction.options.getInteger('bet') || 100;
    const res = GamesEngine.playBlackjack(interaction.guildId, interaction.user.id, bet);
    if (res.error) {
      return interaction.reply({ embeds: [KikiEmbed.error('Blackjack Error ⚠️', res.error)] });
    }

    const title = res.result === 'blackjack' ? '🃏 BLACKJACK 21! 🏆' :
      res.result === 'win' ? '🃏 YOU WON BLACKJACK! 🎉' :
      res.result === 'tie' ? '🃏 BLACKJACK PUSH (TIE) 🤝' :
      '🃏 DEALER WINS BLACKJACK 💀';

    const desc =
      '**Your Hand:** ' + res.playerHand + ' (Score: **' + res.playerScore + '**)\n' +
      '**Dealer Hand:** ' + res.dealerHand + ' (Score: **' + res.dealerScore + '**)\n\n' +
      '**Wager:** `' + res.bet.toLocaleString() + ' Coins` | **Result:** `' + res.result.toUpperCase() + '`\n' +
      (res.payout > 0 ? '**Payout:** `+' + res.payout.toLocaleString() + ' Coins`\n' : '') +
      '💰 **Wallet:** `' + res.newWallet.toLocaleString() + ' Coins`';

    const embed = res.result === 'win' || res.result === 'blackjack' ?
      KikiEmbed.success(title, desc) :
      res.result === 'tie' ? KikiEmbed.purple(title, desc) : KikiEmbed.error(title, desc);

    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const bet = parseInt(args[0]) || 100;
    const res = GamesEngine.playBlackjack(message.guild.id, message.author.id, bet);
    if (res.error) {
      return message.reply({ embeds: [KikiEmbed.error('Blackjack Error ⚠️', res.error)] });
    }

    const title = res.result === 'blackjack' ? '🃏 BLACKJACK 21! 🏆' :
      res.result === 'win' ? '🃏 YOU WON BLACKJACK! 🎉' :
      res.result === 'tie' ? '🃏 BLACKJACK PUSH (TIE) 🤝' :
      '🃏 DEALER WINS BLACKJACK 💀';

    const desc =
      '**Your Hand:** ' + res.playerHand + ' (Score: **' + res.playerScore + '**)\n' +
      '**Dealer Hand:** ' + res.dealerHand + ' (Score: **' + res.dealerScore + '**)\n\n' +
      '**Wager:** `' + res.bet.toLocaleString() + ' Coins` | **Result:** `' + res.result.toUpperCase() + '`\n' +
      (res.payout > 0 ? '**Payout:** `+' + res.payout.toLocaleString() + ' Coins`\n' : '') +
      '💰 **Wallet:** `' + res.newWallet.toLocaleString() + ' Coins`';

    const embed = res.result === 'win' || res.result === 'blackjack' ?
      KikiEmbed.success(title, desc) :
      res.result === 'tie' ? KikiEmbed.purple(title, desc) : KikiEmbed.error(title, desc);

    message.reply({ embeds: [embed] });
  }
};
