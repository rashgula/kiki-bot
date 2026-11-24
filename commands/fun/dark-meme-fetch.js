const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dark-meme-fetch')
    .setDescription('🎭 Fetch a curated gothic meme'),

  aliases: ['meme', 'darkmeme'],
  name: 'dark-meme-fetch',

  async execute(interaction, client) {
    const m = FunEngine.getMeme();
    const embed = KikiEmbed.purple(`🎭 ${m.title}`, 'Fresh from the gothic meme vault!')
      .setImage(m.url);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const m = FunEngine.getMeme();
    const embed = KikiEmbed.purple(`🎭 ${m.title}`, 'Fresh from the gothic meme vault!')
      .setImage(m.url);
    message.reply({ embeds: [embed] });
  }
};
