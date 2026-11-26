const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance-wallet-view')
    .setDescription('💰 Inspect personal gothic coin wallet and bank')
    .addUserOption(o => o.setName('user').setDescription('Target user')),

  aliases: ['balance', 'bal', 'wallet', 'paisa'],
  name: 'balance-wallet-view',

  async execute(interaction, client) {
    const target = interaction.options.getUser('user') || interaction.user;
    const bal = Economy.getBalance(interaction.guildId, target.id);
    const embed = KikiEmbed.purple(`💰 Gothic Vault: ${target.username}`,
      `**Wallet:** \`${bal.wallet.toLocaleString()} Gothic Coins\`\n` +
      `**Bank:** \`${bal.bank.toLocaleString()} Gothic Coins\`\n` +
      `**Net Worth:** \`${bal.netWorth.toLocaleString()} Gothic Coins\`\n\n` +
      `*Use \`&daily\` or \`&work\` to earn more coins!*`
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const cleanId = args[0]?.replace(/[<@!>]/g, '');
    const target = message.mentions?.users?.first?.()
      || (cleanId && /^\d{17,20}$/.test(cleanId) ? message.guild.members.cache.get(cleanId)?.user : null)
      || message.author;
    const bal = Economy.getBalance(message.guild.id, target.id);
    const embed = KikiEmbed.purple(`💰 Gothic Vault: ${target.username}`,
      `**Wallet:** \`${(bal.wallet || 0).toLocaleString()} Gothic Coins\`\n` +
      `**Bank:** \`${(bal.bank || 0).toLocaleString()} Gothic Coins\`\n` +
      `**Net Worth:** \`${(bal.netWorth || bal.total || 0).toLocaleString()} Gothic Coins\`\n\n` +
      `*Use \`&daily\` or \`&work\` to earn more coins!*`
    );
    message.reply({ embeds: [embed] });
  }
};
