const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance-wallet-view')
    .setDescription('💰 Inspect personal gothic coin wallet and bank')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('💰 BALANCE-WALLET-VIEW',
      '**Action:** Inspect personal gothic coin wallet and bank\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'balance-wallet-view',
  aliases: ['k-balance-wallet-view', 'balancewalletview'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('💰 BALANCE-WALLET-VIEW',
      '**Command:** `balance-wallet-view`\\n' +
      '**Description:** Inspect personal gothic coin wallet and bank\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
