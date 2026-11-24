const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('riddle-solve-puzzle')
    .setDescription('🧩 Solve clever brain teaser riddle'),

  aliases: ['riddle', 'puzzle'],
  name: 'riddle-solve-puzzle',

  async execute(interaction, client) {
    const r = GamesEngine.getRiddle();
    const embed = KikiEmbed.purple('🧩 Gothic Riddle Box',
      '**Riddle:**\n*' + r.question + '*\n\n' +
      '💡 **Hint:** `' + r.hint + '`\n\n' +
      '*Click spoiler for answer:*\n' + r.answer
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const r = GamesEngine.getRiddle();
    const embed = KikiEmbed.purple('🧩 Gothic Riddle Box',
      '**Riddle:**\n*' + r.question + '*\n\n' +
      '💡 **Hint:** `' + r.hint + '`\n\n' +
      '*Click spoiler for answer:*\n' + r.answer
    );
    message.reply({ embeds: [embed] });
  }
};
