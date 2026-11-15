const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('text-vaporwave-gen')
    .setDescription('🌸 Convert text to aesthetic fullwidth characters')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🌸 TEXT-VAPORWAVE-GEN',
      '**Action:** Convert text to aesthetic fullwidth characters\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'text-vaporwave-gen',
  aliases: ['k-text-vaporwave-gen', 'textvaporwavegen'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🌸 TEXT-VAPORWAVE-GEN',
      '**Command:** `text-vaporwave-gen`\\n' +
      '**Description:** Convert text to aesthetic fullwidth characters\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
