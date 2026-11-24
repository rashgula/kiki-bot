const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy-shop-item')
    .setDescription('🛍️ Purchase an artifact from the shop')
    .addStringOption(o => o.setName('item').setDescription('Item ID').setRequired(true)),

  aliases: ['buy'],
  name: 'buy-shop-item',

  async execute(interaction, client) {
    const item = interaction.options.getString('item');
    const res = Economy.buyItem(interaction.guildId, interaction.user.id, item);
    if (!res.success) {
      return interaction.reply({ embeds: [KikiEmbed.error('Purchase Failed', res.message)] });
    }
    const embed = KikiEmbed.success('Artifact Acquired! 🛍️',
      `${res.message}\n\n**Remaining Wallet:** \`${res.balance.toLocaleString()} Coins\``
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const item = args[0];
    if (!item) {
      return message.reply({ embeds: [KikiEmbed.error('No Item Specified', 'Kripya item ID batayein! Example: `&buy shield`')] });
    }
    const res = Economy.buyItem(message.guild.id, message.author.id, item);
    if (!res.success) {
      return message.reply({ embeds: [KikiEmbed.error('Purchase Failed', res.message)] });
    }
    const embed = KikiEmbed.success('Artifact Acquired! 🛍️',
      `${res.message}\n\n**Remaining Wallet:** \`${res.balance.toLocaleString()} Coins\``
    );
    message.reply({ embeds: [embed] });
  }
};
