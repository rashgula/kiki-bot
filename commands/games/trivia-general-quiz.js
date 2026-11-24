const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia-general-quiz')
    .setDescription('🎮 Answer general knowledge trivia question'),

  aliases: ['generaltrivia', 'gkquiz'],
  name: 'trivia-general-quiz',

  async execute(interaction, client) {
    const t = GamesEngine.getGeneralTrivia();
    const embed = KikiEmbed.purple('🧠 General Knowledge Trivia',
      '**Question:**\n' + t.question + '\n\n' +
      '**Options:**\n' + t.options + '\n\n' +
      '*Reveal answer:* ' + t.answer
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const t = GamesEngine.getGeneralTrivia();
    const embed = KikiEmbed.purple('🧠 General Knowledge Trivia',
      '**Question:**\n' + t.question + '\n\n' +
      '**Options:**\n' + t.options + '\n\n' +
      '*Reveal answer:* ' + t.answer
    );
    message.reply({ embeds: [embed] });
  }
};
