const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('withdraw-bank-coins')
    .setDescription('🏧 Withdraw stored coins from bank vault')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🏧 WITHDRAW-BANK-COINS',
      '**Action:** Withdraw stored coins from bank vault\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'withdraw-bank-coins',
  aliases: ['k-withdraw-bank-coins', 'withdrawbankcoins'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🏧 WITHDRAW-BANK-COINS',
      '**Command:** `withdraw-bank-coins`\\n' +
      '**Description:** Withdraw stored coins from bank vault\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
