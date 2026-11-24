const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cat-photo-random')
    .setDescription('🐱 Send a cute random gothic cat photo'),

  aliases: ['cat', 'meow', 'catphoto'],
  name: 'cat-photo-random',

  async execute(interaction, client) {
    const url = FunEngine.getCat();
    const embed = KikiEmbed.purple('Gothic Feline Companion 🐱', 'Purr... shadows bring companionship.')
      .setImage(url);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const url = FunEngine.getCat();
    const embed = KikiEmbed.purple('Gothic Feline Companion 🐱', 'Purr... shadows bring companionship.')
      .setImage(url);
    message.reply({ embeds: [embed] });
  }
};
