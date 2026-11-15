const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('monthly-reward-claim')
    .setDescription('🏆 Claim monthly elite coin jackpot')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🏆 MONTHLY-REWARD-CLAIM',
      '**Action:** Claim monthly elite coin jackpot\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'monthly-reward-claim',
  aliases: ['k-monthly-reward-claim', 'monthlyrewardclaim'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🏆 MONTHLY-REWARD-CLAIM',
      '**Command:** `monthly-reward-claim`\\n' +
      '**Description:** Claim monthly elite coin jackpot\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
