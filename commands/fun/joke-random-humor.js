const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joke-random-humor')
    .setDescription('😂 Get a funny tech / gothic joke'),

  aliases: ['k-joke-random-humor', 'jokerandomhumor'],
  name: 'joke-random-humor',

  async execute(interaction) {
    await interaction.reply({ embeds: [KikiEmbed.purple('😂 Coven Humor', FunEngine.getJoke())] });
  },

  async run(message) {
    message.reply({ embeds: [KikiEmbed.purple('😂 Coven Humor', FunEngine.getJoke())] });
  }
};
