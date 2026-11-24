const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fast-typer-race')
    .setDescription('⌨️ Type displayed sentence fastest to win'),

  aliases: ['type', 'typerace', 'fasttype'],
  name: 'fast-typer-race',

  async execute(interaction, client) {
    const t = GamesEngine.getFastTyperSentence();
    const embed = KikiEmbed.purple('⌨️ Fast Typing Race',
      t.instructions + '\n\n**Type this sentence:**\n`' + t.sentence + '`\n\n⏱️ *First one to type wins the speed badge!*'
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const t = GamesEngine.getFastTyperSentence();
    const embed = KikiEmbed.purple('⌨️ Fast Typing Race',
      t.instructions + '\n\n**Type this sentence:**\n`' + t.sentence + '`\n\n⏱️ *First one to type wins the speed badge!*'
    );
    message.reply({ embeds: [embed] });
  }
};
