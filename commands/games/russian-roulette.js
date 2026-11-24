const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('russian-roulette')
    .setDescription('🔫 Spin the cylinder and test your luck in Russian Roulette'),

  aliases: ['rr', 'russianroulette'],
  name: 'russian-roulette',

  async execute(interaction, client) {
    const res = GamesEngine.playRussianRoulette(interaction.user.username);
    const embed = res.survived ?
      KikiEmbed.success('Survived Russian Roulette! 🔫', res.message) :
      KikiEmbed.error('Fallen in Russian Roulette! 💀', res.message);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const res = GamesEngine.playRussianRoulette(message.author.username);
    const embed = res.survived ?
      KikiEmbed.success('Survived Russian Roulette! 🔫', res.message) :
      KikiEmbed.error('Fallen in Russian Roulette! 💀', res.message);
    message.reply({ embeds: [embed] });
  }
};
