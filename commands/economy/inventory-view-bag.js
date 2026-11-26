const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory-view-bag')
    .setDescription('🎒 View items in your gothic inventory bag'),

  aliases: ['inventory', 'inv', 'bag'],
  name: 'inventory-view-bag',

  async execute(interaction, client) {
    const target = interaction.user;
    const items = Economy.getInventoryList(interaction.guildId, target.id);
    const desc = items.length === 0
      ? 'Aapka gothic bag bilkul khali hai! `&shop` se items khareedein.'
      : items.map(i => `• **${i.name}** (\`${i.id}\`) ×${i.count}\n  *${i.desc}*`).join('\n\n');

    const embed = KikiEmbed.purple(`🎒 Inventory: ${target.username}`, desc);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const items = Economy.getInventoryList(message.guild.id, message.author.id);
    const desc = items.length === 0
      ? 'Aapka gothic bag bilkul khali hai! `&shop` se items khareedein.'
      : items.map(i => `• **${i.name}** (\`${i.id}\`) ×${i.count}\n  *${i.desc}*`).join('\n\n');

    const embed = KikiEmbed.purple(`🎒 Inventory: ${message.author.username}`, desc);
    message.reply({ embeds: [embed] });
  }
};
