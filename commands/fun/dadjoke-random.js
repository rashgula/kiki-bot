const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dadjoke-random')
    .setDescription('🃏 Tell a gothic/developer joke'),

  aliases: ['joke', 'dadjoke'],
  name: 'dadjoke-random',

  async execute(interaction, client) {
    const j = FunEngine.getJoke();
    const embed = KikiEmbed.purple('🃏 Gothic Joke Box', j);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const j = FunEngine.getJoke();
    const embed = KikiEmbed.purple('🃏 Gothic Joke Box', j);
    message.reply({ embeds: [embed] });
  }
};
