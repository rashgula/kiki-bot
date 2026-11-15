const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('potion-brew-cauldron')
    .setDescription('🧪 Mix ingredients and brew enchanted potion')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🧪 POTION-BREW-CAULDRON',
      '**Action:** Mix ingredients and brew enchanted potion\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'potion-brew-cauldron',
  aliases: ['k-potion-brew-cauldron', 'potionbrewcauldron'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🧪 POTION-BREW-CAULDRON',
      '**Command:** `potion-brew-cauldron`\\n' +
      '**Description:** Mix ingredients and brew enchanted potion\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
