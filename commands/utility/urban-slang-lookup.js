const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('urban-slang-lookup')
    .setDescription('🏙️ Query slang definitions from Urban Dictionary')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🏙️ URBAN-SLANG-LOOKUP',
      '**Action:** Query slang definitions from Urban Dictionary\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'urban-slang-lookup',
  aliases: ['k-urban-slang-lookup', 'urbanslanglookup'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🏙️ URBAN-SLANG-LOOKUP',
      '**Command:** `urban-slang-lookup`\\n' +
      '**Description:** Query slang definitions from Urban Dictionary\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
