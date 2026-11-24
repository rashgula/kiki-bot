const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia-math-speed')
    .setDescription('🎮 Solve speed mental arithmetic problem for points'),

  aliases: ['mathspeed', 'mathquiz'],
  name: 'trivia-math-speed',

  async execute(interaction, client) {
    const m = GamesEngine.getMathSpeedChallenge();
    const embed = KikiEmbed.purple('⚡ Speed Arithmetic Challenge',
      '**Solve this fast:**\n`' + m.problem + '`\n\n*Reveal answer:* ' + m.answer
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const m = GamesEngine.getMathSpeedChallenge();
    const embed = KikiEmbed.purple('⚡ Speed Arithmetic Challenge',
      '**Solve this fast:**\n`' + m.problem + '`\n\n*Reveal answer:* ' + m.answer
    );
    message.reply({ embeds: [embed] });
  }
};
