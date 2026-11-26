const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('use-inventory-item')
    .setDescription('✨ Consume or activate an inventory item')
    .addStringOption(o => o.setName('item').setDescription('Item ID from your &inv').setRequired(true)),

  aliases: ['use', 'useitem'],
  name: 'use-inventory-item',

  async execute(interaction, client) {
    const item = interaction.options.getString('item');
    const res = Economy.useItem(interaction.guildId, interaction.user.id, item);
    if (!res.success) {
      return interaction.reply({ embeds: [KikiEmbed.error('Item Error ⚠️', res.message)] });
    }
    const embed = KikiEmbed.success('Artifact Activated ✨',
      `${res.message}\n\n**Wallet:** \`${res.wallet.toLocaleString()} Coins\``
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const item = args.join(' ');
    if (!item) {
      return message.reply({ embeds: [KikiEmbed.warn('Item ID Missing', 'Kripya item ID batayein! Example: `&use tarot_charm` or `&inv`')] });
    }
    const res = Economy.useItem(message.guild.id, message.author.id, item);
    if (!res.success) {
      return message.reply({ embeds: [KikiEmbed.error('Item Error ⚠️', res.message)] });
    }
    const embed = KikiEmbed.success('Artifact Activated ✨',
      `${res.message}\n\n**Wallet:** \`${res.wallet.toLocaleString()} Coins\``
    );
    message.reply({ embeds: [embed] });
  }
};
