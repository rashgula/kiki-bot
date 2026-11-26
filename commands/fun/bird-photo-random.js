const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bird-photo-random')
    .setDescription('🐦 Summon a cute / raven bird photo'),

  aliases: ['k-bird-photo-random', 'birdphotorandom'],
  name: 'bird-photo-random',

  async execute(interaction) {
    const img = FunEngine.getBird();
    await interaction.reply({ embeds: [KikiEmbed.purple('🐦 Nocturnal Bird', 'Ek khoobsurat bird aapke liye ✨').setImage(img)] });
  },

  async run(message) {
    const img = FunEngine.getBird();
    message.reply({ embeds: [KikiEmbed.purple('🐦 Nocturnal Bird', 'Ek khoobsurat bird aapke liye ✨').setImage(img)] });
  }
};
