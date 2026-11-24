const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia-gaming-quiz')
    .setDescription('🎮 Answer video game lore and history trivia'),

  aliases: ['gamingtrivia', 'gamequiz'],
  name: 'trivia-gaming-quiz',

  async execute(interaction, client) {
    const t = GamesEngine.getGamingTrivia();
    const embed = KikiEmbed.purple('🎮 Video Games Lore Trivia',
      '**Question:**\n' + t.question + '\n\n' +
      '**Options:**\n' + t.options + '\n\n' +
      '*Reveal answer:* ' + t.answer
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const t = GamesEngine.getGamingTrivia();
    const embed = KikiEmbed.purple('🎮 Video Games Lore Trivia',
      '**Question:**\n' + t.question + '\n\n' +
      '**Options:**\n' + t.options + '\n\n' +
      '*Reveal answer:* ' + t.answer
    );
    message.reply({ embeds: [embed] });
  }
};
