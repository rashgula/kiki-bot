const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('magic-mirror-gaze')
    .setDescription('🪞 Look into dark mirror and reveal true reflection')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🪞 MAGIC-MIRROR-GAZE',
      '**Action:** Look into dark mirror and reveal true reflection\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'magic-mirror-gaze',
  aliases: ['k-magic-mirror-gaze', 'magicmirrorgaze'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🪞 MAGIC-MIRROR-GAZE',
      '**Command:** `magic-mirror-gaze`\n' +
      '**Description:** Look into dark mirror and reveal true reflection\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
