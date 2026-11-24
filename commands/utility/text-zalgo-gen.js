const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('text-zalgo-gen')
    .setDescription('🕷️ Infuse text with chaotic dark zalgo runes')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🕷️ TEXT-ZALGO-GEN',
      '**Action:** Infuse text with chaotic dark zalgo runes\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'text-zalgo-gen',
  aliases: ['k-text-zalgo-gen', 'textzalgogen'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🕷️ TEXT-ZALGO-GEN',
      '**Command:** `text-zalgo-gen`\n' +
      '**Description:** Infuse text with chaotic dark zalgo runes\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
