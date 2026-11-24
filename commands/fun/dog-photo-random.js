const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dog-photo-random')
    .setDescription('🐶 Send an adorable canine friend photo'),

  aliases: ['dog', 'woof', 'dogphoto'],
  name: 'dog-photo-random',

  async execute(interaction, client) {
    const url = FunEngine.getDog();
    const embed = KikiEmbed.purple('Loyal Direhound Companion 🐶', 'Woof! Faithful guardian of the night.')
      .setImage(url);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const url = FunEngine.getDog();
    const embed = KikiEmbed.purple('Loyal Direhound Companion 🐶', 'Woof! Faithful guardian of the night.')
      .setImage(url);
    message.reply({ embeds: [embed] });
  }
};
