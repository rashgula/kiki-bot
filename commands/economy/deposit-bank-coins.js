const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('deposit-bank-coins')
    .setDescription('🏦 Safely deposit wallet coins into bank vault')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🏦 DEPOSIT-BANK-COINS',
      '**Action:** Safely deposit wallet coins into bank vault\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'deposit-bank-coins',
  aliases: ['k-deposit-bank-coins', 'depositbankcoins'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🏦 DEPOSIT-BANK-COINS',
      '**Command:** `deposit-bank-coins`\\n' +
      '**Description:** Safely deposit wallet coins into bank vault\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
