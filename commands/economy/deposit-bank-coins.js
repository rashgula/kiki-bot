const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deposit-bank-coins')
    .setDescription('🏦 Deposit coins from wallet to secure vault bank')
    .addStringOption(o => o.setName('amount').setDescription('Amount or "all"').setRequired(true)),

  aliases: ['deposit', 'dep'],
  name: 'deposit-bank-coins',

  async execute(interaction, client) {
    const amt = interaction.options.getString('amount');
    const res = Economy.deposit(interaction.guildId, interaction.user.id, amt);
    if (!res.success) {
      return interaction.reply({ embeds: [KikiEmbed.error('Deposit Error', res.message)] });
    }
    const embed = KikiEmbed.success('Bank Deposit Vault 🏦',
      `${res.message}\n\n**Wallet:** \`${res.wallet.toLocaleString()}\` | **Bank:** \`${res.bank.toLocaleString()}\``
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const amt = args[0] || 'all';
    const res = Economy.deposit(message.guild.id, message.author.id, amt);
    if (!res.success) {
      return message.reply({ embeds: [KikiEmbed.error('Deposit Error', res.message)] });
    }
    const embed = KikiEmbed.success('Bank Deposit Vault 🏦',
      `${res.message}\n\n**Wallet:** \`${res.wallet.toLocaleString()}\` | **Bank:** \`${res.bank.toLocaleString()}\``
    );
    message.reply({ embeds: [embed] });
  }
};
