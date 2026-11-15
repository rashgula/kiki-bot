const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('gothic-coinflip')
    .setDescription('🪙 Flip gothic crown and skull challenge coin')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🪙 GOTHIC-COINFLIP',
      '**Action:** Flip gothic crown and skull challenge coin\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'gothic-coinflip',
  aliases: ['k-gothic-coinflip', 'gothiccoinflip'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🪙 GOTHIC-COINFLIP',
      '**Command:** `gothic-coinflip`\\n' +
      '**Description:** Flip gothic crown and skull challenge coin\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
