const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gothic-dice-roll')
    .setDescription('🎲 Roll a polyhedral die (default 6 sides)')
    .addIntegerOption(o => o.setName('sides').setDescription('Number of sides')),

  aliases: ['gdice', 'groll'],
  name: 'gothic-dice-roll',

  async execute(interaction, client) {
    const sides = interaction.options.getInteger('sides') || 6;
    const res = FunEngine.rollDice(sides);
    const embed = KikiEmbed.purple('Gothic Die Roll 🎲', `You rolled a **d${res.sides}** ${res.faces}\nTotal: **${res.total}**!`);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const sides = parseInt(args[0]) || 6;
    const res = FunEngine.rollDice(sides);
    const embed = KikiEmbed.purple('Gothic Die Roll 🎲', `You rolled a **d${res.sides}** ${res.faces}\nTotal: **${res.total}**!`);
    message.reply({ embeds: [embed] });
  }
};
