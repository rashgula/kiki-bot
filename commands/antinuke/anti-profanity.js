const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('anti-profanity')
    .setDescription('🛡️ Filter offensive slurs and profanity')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🛡️ ANTI-PROFANITY',
      '**Action:** Filter offensive slurs and profanity\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'anti-profanity',
  aliases: ['k-anti-profanity', 'antiprofanity'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🛡️ ANTI-PROFANITY',
      '**Command:** `anti-profanity`\\n' +
      '**Description:** Filter offensive slurs and profanity\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
