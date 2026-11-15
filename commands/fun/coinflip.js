const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('coinflip').setDescription('🪙 Flip a gothic coin'),
  async execute(interaction) {
    const side = Math.random() > 0.5 ? 'Heads (The Crown) 👑' : 'Tails (The Skull) 💀';
    await interaction.reply({ embeds: [KikiEmbed.purple('🪙 Coin Flip', `The coin landed on: **${side}**`)] });
  },
  name: 'coinflip', aliases: ['flip', 'cf'],
  async run(message) {
    const side = Math.random() > 0.5 ? 'Heads 👑' : 'Tails 💀';
    message.reply({ embeds: [KikiEmbed.purple('🪙 Coin Flip', `**${side}**`)] });
  }
};
