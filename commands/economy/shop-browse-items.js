const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop-browse-items')
    .setDescription('🛒 Browse gothic artifact shop items'),

  aliases: ['shop', 'store'],
  name: 'shop-browse-items',

  async execute(interaction, client) {
    let list = Economy.SHOP_ITEMS.map((item, idx) =>
      `**${idx + 1}. ${item.name}** (\`${item.id}\`)\n` +
      `Price: \`${item.price.toLocaleString()} Coins\`\n` +
      `*${item.desc}*`
    ).join('\n\n');

    const embed = KikiEmbed.purple('Gothic Coven Shop 🛒',
      list + '\n\n*Buy an item with \`&buy <item_id>\`*'
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    let list = Economy.SHOP_ITEMS.map((item, idx) =>
      `**${idx + 1}. ${item.name}** (\`${item.id}\`)\n` +
      `Price: \`${item.price.toLocaleString()} Coins\`\n` +
      `*${item.desc}*`
    ).join('\n\n');

    const embed = KikiEmbed.purple('Gothic Coven Shop 🛒',
      list + '\n\n*Buy an item with `&buy <item_id>`*'
    );
    message.reply({ embeds: [embed] });
  }
};
