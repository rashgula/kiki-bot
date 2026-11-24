const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia-anime-quiz')
    .setDescription('🎮 Answer anime history and character trivia'),

  aliases: ['animetrivia', 'animequiz'],
  name: 'trivia-anime-quiz',

  async execute(interaction, client) {
    const t = GamesEngine.getAnimeTrivia();
    const embed = KikiEmbed.purple('⛩️ Anime & Manga Trivia',
      '**Question:**\n' + t.question + '\n\n' +
      '**Options:**\n' + t.options + '\n\n' +
      '*Reveal answer:* ' + t.answer
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const t = GamesEngine.getAnimeTrivia();
    const embed = KikiEmbed.purple('⛩️ Anime & Manga Trivia',
      '**Question:**\n' + t.question + '\n\n' +
      '**Options:**\n' + t.options + '\n\n' +
      '*Reveal answer:* ' + t.answer
    );
    message.reply({ embeds: [embed] });
  }
};
