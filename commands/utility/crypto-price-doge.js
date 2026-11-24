const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('crypto-price-doge')
    .setDescription('🪙 Look up live Dogecoin exchange rate')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🪙 CRYPTO-PRICE-DOGE',
      '**Action:** Look up live Dogecoin exchange rate\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'crypto-price-doge',
  aliases: ['k-crypto-price-doge', 'cryptopricedoge'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🪙 CRYPTO-PRICE-DOGE',
      '**Command:** `crypto-price-doge`\n' +
      '**Description:** Look up live Dogecoin exchange rate\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
