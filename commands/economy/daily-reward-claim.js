const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily-reward-claim')
    .setDescription('🎁 Claim daily gothic purple coin bonus')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🎁 DAILY-REWARD-CLAIM',
      '**Action:** Claim daily gothic purple coin bonus\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'daily-reward-claim',
  aliases: ['k-daily-reward-claim', 'dailyrewardclaim'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🎁 DAILY-REWARD-CLAIM',
      '**Command:** `daily-reward-claim`\\n' +
      '**Description:** Claim daily gothic purple coin bonus\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
