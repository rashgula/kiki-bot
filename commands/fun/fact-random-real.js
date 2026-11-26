const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fact-random-real')
    .setDescription('🧠 Learn a fascinating random fact'),

  aliases: ['k-fact-random-real', 'factrandomreal'],
  name: 'fact-random-real',

  async execute(interaction) {
    await interaction.reply({ embeds: [KikiEmbed.purple('🧠 Dark Wisdom • Fact', FunEngine.getFact())] });
  },

  async run(message) {
    message.reply({ embeds: [KikiEmbed.purple('🧠 Dark Wisdom • Fact', FunEngine.getFact())] });
  }
};
