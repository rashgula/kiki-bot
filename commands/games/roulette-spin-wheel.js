const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roulette-spin-wheel')
    .setDescription('🎰 Bet on red, black, even, odd, or exact number on roulette')
    .addIntegerOption(o => o.setName('amount').setDescription('Coins to bet').setRequired(true))
    .addStringOption(o => o.setName('bet').setDescription('red, black, even, odd, or 0-36').setRequired(true)),

  aliases: ['roulette'],
  name: 'roulette-spin-wheel',

  async execute(interaction, client) {
    const amt = interaction.options.getInteger('amount') || 50;
    const bet = interaction.options.getString('bet') || 'red';
    const res = GamesEngine.playRoulette(interaction.guildId, interaction.user.id, amt, bet);
    if (res.error) {
      return interaction.reply({ embeds: [KikiEmbed.error('Roulette Error', res.error)] });
    }

    const colorEmoji = res.wheelColor === 'red' ? '🔴 RED' : res.wheelColor === 'black' ? '⚫ BLACK' : '🟢 GREEN';
    const embed = res.win ?
      KikiEmbed.success('Roulette WINNER! 🎰',
        'Ball landed on: **' + res.wheelNumber + '** (' + colorEmoji + ')!\n' +
        'Your bet: **' + res.choice.toUpperCase() + '** (' + res.multiplier + 'x)\n\n' +
        '🎁 **Payout:** `+' + res.payout.toLocaleString() + ' Coins`\n💰 **Wallet:** `' + res.newWallet.toLocaleString() + ' Coins`'
      ) :
      KikiEmbed.error('Roulette Loss! 💀',
        'Ball landed on: **' + res.wheelNumber + '** (' + colorEmoji + ')!\n' +
        'Your bet was: **' + res.choice.toUpperCase() + '**\n\n' +
        '💸 **Lost:** `' + res.bet.toLocaleString() + ' Coins`\n💰 **Wallet:** `' + res.newWallet.toLocaleString() + ' Coins`'
      );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const amt = parseInt(args[0]) || 50;
    const bet = args[1] || 'red';
    const res = GamesEngine.playRoulette(message.guild.id, message.author.id, amt, bet);
    if (res.error) {
      return message.reply({ embeds: [KikiEmbed.error('Roulette Error', res.error)] });
    }

    const colorEmoji = res.wheelColor === 'red' ? '🔴 RED' : res.wheelColor === 'black' ? '⚫ BLACK' : '🟢 GREEN';
    const embed = res.win ?
      KikiEmbed.success('Roulette WINNER! 🎰',
        'Ball landed on: **' + res.wheelNumber + '** (' + colorEmoji + ')!\n' +
        'Your bet: **' + res.choice.toUpperCase() + '** (' + res.multiplier + 'x)\n\n' +
        '🎁 **Payout:** `+' + res.payout.toLocaleString() + ' Coins`\n💰 **Wallet:** `' + res.newWallet.toLocaleString() + ' Coins`'
      ) :
      KikiEmbed.error('Roulette Loss! 💀',
        'Ball landed on: **' + res.wheelNumber + '** (' + colorEmoji + ')!\n' +
        'Your bet was: **' + res.choice.toUpperCase() + '**\n\n' +
        '💸 **Lost:** `' + res.bet.toLocaleString() + ' Coins`\n💰 **Wallet:** `' + res.newWallet.toLocaleString() + ' Coins`'
      );
    message.reply({ embeds: [embed] });
  }
};
