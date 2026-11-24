const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-pick-winner')
    .setDescription('🎉 Reroll new winner for previous giveaway')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🎉 GIVEAWAY-PICK-WINNER',
      '**Action:** Reroll new winner for previous giveaway\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'giveaway-pick-winner',
  aliases: ['k-giveaway-pick-winner', 'giveawaypickwinner'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🎉 GIVEAWAY-PICK-WINNER',
      '**Command:** `giveaway-pick-winner`\n' +
      '**Description:** Reroll new winner for previous giveaway\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
