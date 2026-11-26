const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia-question-play')
    .setDescription('❓ Play a quick trivia question challenge'),

  aliases: ['k-trivia-question-play', 'triviaquestionplay'],
  name: 'trivia-question-play',

  async execute(interaction) {
    const t = FunEngine.getTrivia();
    const opts = t.options.map((o, i) => `**${i + 1}.** ${o}`).join('\n');
    await interaction.reply({
      embeds: [KikiEmbed.purple('❓ KIKI Trivia Challenge', `**Question:** ${t.q}\n\n${opts}\n\n**Answer:** ||${t.a}||`)]
    });
  },

  async run(message) {
    const t = FunEngine.getTrivia();
    const opts = t.options.map((o, i) => `**${i + 1}.** ${o}`).join('\n');
    message.reply({
      embeds: [KikiEmbed.purple('❓ KIKI Trivia Challenge', `**Question:** ${t.q}\n\n${opts}\n\n**Answer:** ||${t.a}||`)]
    });
  }
};
