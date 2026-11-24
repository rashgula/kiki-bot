const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coin-wager-bet')
    .setDescription('🪙 Wager coins on a 50/50 coinflip toss')
    .addIntegerOption(o => o.setName('amount').setDescription('Coins to wager').setRequired(true))
    .addStringOption(o => o.setName('choice').setDescription('heads or tails')),

  aliases: ['coinwager', 'wager'],
  name: 'coin-wager-bet',

  async execute(interaction, client) {
    const amt = interaction.options.getInteger('amount') || 50;
    const choice = interaction.options.getString('choice') || 'heads';
    const res = GamesEngine.playCoinWager(interaction.guildId, interaction.user.id, amt, choice);
    if (res.error) {
      return interaction.reply({ embeds: [KikiEmbed.error('Wager Error', res.error)] });
    }

    const embed = res.win ?
      KikiEmbed.success('Coin Wager Won! 🪙',
        'Coin landed on: **' + res.icon + '**!\nYour guess: **' + res.userChoice + '**\n\n' +
        '🎁 **Payout:** `+' + res.payout.toLocaleString() + ' Coins`\n💰 **Wallet:** `' + res.newWallet.toLocaleString() + ' Coins`'
      ) :
      KikiEmbed.error('Coin Wager Lost! 💀',
        'Coin landed on: **' + res.icon + '**!\nYour guess: **' + res.userChoice + '**\n\n' +
        '💸 **Lost:** `' + res.bet.toLocaleString() + ' Coins`\n💰 **Wallet:** `' + res.newWallet.toLocaleString() + ' Coins`'
      );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const amt = parseInt(args[0]) || 50;
    const choice = args[1] || 'heads';
    const res = GamesEngine.playCoinWager(message.guild.id, message.author.id, amt, choice);
    if (res.error) {
      return message.reply({ embeds: [KikiEmbed.error('Wager Error', res.error)] });
    }

    const embed = res.win ?
      KikiEmbed.success('Coin Wager Won! 🪙',
        'Coin landed on: **' + res.icon + '**!\nYour guess: **' + res.userChoice + '**\n\n' +
        '🎁 **Payout:** `+' + res.payout.toLocaleString() + ' Coins`\n💰 **Wallet:** `' + res.newWallet.toLocaleString() + ' Coins`'
      ) :
      KikiEmbed.error('Coin Wager Lost! 💀',
        'Coin landed on: **' + res.icon + '**!\nYour guess: **' + res.userChoice + '**\n\n' +
        '💸 **Lost:** `' + res.bet.toLocaleString() + ' Coins`\n💰 **Wallet:** `' + res.newWallet.toLocaleString() + ' Coins`'
      );
    message.reply({ embeds: [embed] });
  }
};
