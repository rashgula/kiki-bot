const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gamble-dice-bet')
    .setDescription('🎲 Bet coins on dark dice roll against KIKI')
    .addIntegerOption(o => o.setName('amount').setDescription('Coins to wager').setRequired(true)),

  aliases: ['bet', 'gamble', 'dicebet'],
  name: 'gamble-dice-bet',

  async execute(interaction, client) {
    const amt = interaction.options.getInteger('amount');
    const res = Economy.gamble(interaction.guildId, interaction.user.id, amt);
    if (!res.success && res.message.includes('Invalid') || !res.success && res.message.includes('paas itne')) {
      return interaction.reply({ embeds: [KikiEmbed.error('Gamble Error ⚠️', res.message)] });
    }
    const embed = res.win ?
      KikiEmbed.success('You Won the Bet! 🎲', `${res.message}\n\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``) :
      KikiEmbed.error('KIKI Won the Bet! 💀', `${res.message}\n\n**Remaining Wallet:** \`${res.balance.toLocaleString()} Coins\``);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const amt = parseInt(args[0]);
    const res = Economy.gamble(message.guild.id, message.author.id, amt);
    if (!res.success && (res.message.includes('Invalid') || res.message.includes('paas itne'))) {
      return message.reply({ embeds: [KikiEmbed.error('Gamble Error ⚠️', res.message)] });
    }
    const embed = res.win ?
      KikiEmbed.success('You Won the Bet! 🎲', `${res.message}\n\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``) :
      KikiEmbed.error('KIKI Won the Bet! 💀', `${res.message}\n\n**Remaining Wallet:** \`${res.balance.toLocaleString()} Coins\``);
    message.reply({ embeds: [embed] });
  }
};
