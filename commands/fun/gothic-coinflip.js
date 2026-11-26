const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gothic-coinflip')
    .setDescription('🪙 Flip a gothic silver coin'),

  aliases: ['coin', 'gcoinflip'],
  name: 'gothic-coinflip',

  async execute(interaction, client) {
    const flip = FunEngine.flipCoin();
    const embed = KikiEmbed.purple('Gothic Coin Toss 🪙', `The coin spins in the moonlight... and lands on: **${flip.icon}**!`);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const flip = FunEngine.flipCoin();
    const embed = KikiEmbed.purple('Gothic Coin Toss 🪙', `The coin spins in the moonlight... and lands on: **${flip.icon}**!`);
    message.reply({ embeds: [embed] });
  }
};
