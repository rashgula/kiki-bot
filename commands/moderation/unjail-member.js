const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('unjail-member')
    .setDescription('🔓 Release member from jail isolation')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🔓 UNJAIL-MEMBER',
      '**Action:** Release member from jail isolation\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'unjail-member',
  aliases: ['k-unjail-member', 'unjailmember'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🔓 UNJAIL-MEMBER',
      '**Command:** `unjail-member`\\n' +
      '**Description:** Release member from jail isolation\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
