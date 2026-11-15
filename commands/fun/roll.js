const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('roll').setDescription('🎲 Roll a die')
    .addIntegerOption(o => o.setName('sides').setDescription('Die sides (default 6)')),
  async execute(interaction) {
    const sides = interaction.options.getInteger('sides') || 6;
    const res = Math.floor(Math.random() * sides) + 1;
    await interaction.reply({ embeds: [KikiEmbed.purple('🎲 Dice Roll', `You rolled a **${res}** (d${sides})`)] });
  },
  name: 'roll', aliases: ['dice'],
  async run(message, args) {
    const sides = parseInt(args[0]) || 6;
    const res = Math.floor(Math.random() * sides) + 1;
    message.reply({ embeds: [KikiEmbed.purple('🎲 Roll', `Result: **${res}** (d${sides})`)] });
  }
};
