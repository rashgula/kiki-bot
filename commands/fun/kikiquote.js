const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
module.exports = {
  data: new SlashCommandBuilder().setName('kikiquote').setDescription('🔮 Receive an arcane quote from KIKI'),
  async execute(interaction) {
    await interaction.reply({ embeds: [KikiEmbed.purple('「 KIKI 」• Arcane Whispers', KIKI.randomQuote())] });
  },
  name: 'kikiquote', aliases: ['kquote', 'quote'],
  async run(message) {
    message.reply({ embeds: [KikiEmbed.purple('KIKI Quote', KIKI.randomQuote())] });
  }
};
