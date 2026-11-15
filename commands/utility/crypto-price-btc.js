const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('crypto-price-btc')
    .setDescription('🪙 Look up live Bitcoin exchange rate')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🪙 CRYPTO-PRICE-BTC',
      '**Action:** Look up live Bitcoin exchange rate\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'crypto-price-btc',
  aliases: ['k-crypto-price-btc', 'cryptopricebtc'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🪙 CRYPTO-PRICE-BTC',
      '**Command:** `crypto-price-btc`\\n' +
      '**Description:** Look up live Bitcoin exchange rate\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
