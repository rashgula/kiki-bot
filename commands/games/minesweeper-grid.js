const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('minesweeper-grid')
    .setDescription('💣 Play interactive spoiler minesweeper grid'),

  aliases: ['minesweeper', 'mines'],
  name: 'minesweeper-grid',

  async execute(interaction, client) {
    const grid = FunEngine.getMinesweeper();
    const embed = KikiEmbed.purple('Gothic Minesweeper 💣',
      `Click the spoiler tiles to uncover the grid without hitting a skull!\n\n${grid}`
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const grid = FunEngine.getMinesweeper();
    const embed = KikiEmbed.purple('Gothic Minesweeper 💣',
      `Click the spoiler tiles to uncover the grid without hitting a skull!\n\n${grid}`
    );
    message.reply({ embeds: [embed] });
  }
};
