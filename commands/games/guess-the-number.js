const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guess-the-number')
    .setDescription('🎮 Guess secret random number between 1 and 100')
    .addIntegerOption(o => o.setName('guess').setDescription('Your guess (1-100)')),

  aliases: ['gtn', 'guess', 'guessthenumber'],
  name: 'guess-the-number',

  async execute(interaction, client) {
    const g = interaction.options.getInteger('guess');
    const res = GamesEngine.playGuessTheNumber(interaction.guildId, interaction.user.id, g);
    const embed = res.correct ?
      KikiEmbed.success('🎯 Guess The Number: WINNER!', res.message) :
      KikiEmbed.purple('🎮 Guess The Number (1 - 100)', res.message);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const g = parseInt(args[0]);
    const res = GamesEngine.playGuessTheNumber(message.guild.id, message.author.id, g);
    const embed = res.correct ?
      KikiEmbed.success('🎯 Guess The Number: WINNER!', res.message) :
      KikiEmbed.purple('🎮 Guess The Number (1 - 100)', res.message);
    message.reply({ embeds: [embed] });
  }
};
