const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kiki-persona-quote')
    .setDescription('🔮 Receive a gothic persona quote from KIKI'),

  aliases: ['k-kiki-persona-quote', 'kikipersonaquote'],
  name: 'kiki-persona-quote',

  async execute(interaction) {
    await interaction.reply({ embeds: [KikiEmbed.purple('🔮 KIKI Persona Quote', FunEngine.getQuote())] });
  },

  async run(message) {
    message.reply({ embeds: [KikiEmbed.purple('🔮 KIKI Persona Quote', FunEngine.getQuote())] });
  }
};
