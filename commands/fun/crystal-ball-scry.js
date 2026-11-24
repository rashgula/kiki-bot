const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('crystal-ball-scry')
    .setDescription('🔮 Scry into deep purple amethyst sphere')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🔮 CRYSTAL-BALL-SCRY',
      '**Action:** Scry into deep purple amethyst sphere\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'crystal-ball-scry',
  aliases: ['k-crystal-ball-scry', 'crystalballscry'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🔮 CRYSTAL-BALL-SCRY',
      '**Command:** `crystal-ball-scry`\n' +
      '**Description:** Scry into deep purple amethyst sphere\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
