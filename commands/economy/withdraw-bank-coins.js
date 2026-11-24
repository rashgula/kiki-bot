const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('withdraw-bank-coins')
    .setDescription('🏦 Withdraw coins from bank vault to wallet')
    .addStringOption(o => o.setName('amount').setDescription('Amount or "all"').setRequired(true)),

  aliases: ['withdraw', 'with'],
  name: 'withdraw-bank-coins',

  async execute(interaction, client) {
    const amt = interaction.options.getString('amount');
    const res = Economy.withdraw(interaction.guildId, interaction.user.id, amt);
    if (!res.success) {
      return interaction.reply({ embeds: [KikiEmbed.error('Withdraw Error', res.message)] });
    }
    const embed = KikiEmbed.success('Bank Withdrawal 🏦',
      `${res.message}\n\n**Wallet:** \`${res.wallet.toLocaleString()}\` | **Bank:** \`${res.bank.toLocaleString()}\``
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const amt = args[0] || 'all';
    const res = Economy.withdraw(message.guild.id, message.author.id, amt);
    if (!res.success) {
      return message.reply({ embeds: [KikiEmbed.error('Withdraw Error', res.message)] });
    }
    const embed = KikiEmbed.success('Bank Withdrawal 🏦',
      `${res.message}\n\n**Wallet:** \`${res.wallet.toLocaleString()}\` | **Bank:** \`${res.bank.toLocaleString()}\``
    );
    message.reply({ embeds: [embed] });
  }
};
