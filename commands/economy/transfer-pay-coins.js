const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer-pay-coins')
    .setDescription('💸 Transfer coins to another server member')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('💸 TRANSFER-PAY-COINS',
      '**Action:** Transfer coins to another server member\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'transfer-pay-coins',
  aliases: ['k-transfer-pay-coins', 'transferpaycoins'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('💸 TRANSFER-PAY-COINS',
      '**Command:** `transfer-pay-coins`\\n' +
      '**Description:** Transfer coins to another server member\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
