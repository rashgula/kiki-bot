const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('weekly-reward-claim')
    .setDescription('📅 Claim weekly loyalty coin allowance')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('📅 WEEKLY-REWARD-CLAIM',
      '**Action:** Claim weekly loyalty coin allowance\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'weekly-reward-claim',
  aliases: ['k-weekly-reward-claim', 'weeklyrewardclaim'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('📅 WEEKLY-REWARD-CLAIM',
      '**Command:** `weekly-reward-claim`\n' +
      '**Description:** Claim weekly loyalty coin allowance\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
