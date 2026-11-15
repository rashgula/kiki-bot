const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('kiki-persona-quote')
    .setDescription('🔮 Receive arcane gothic quote from KIKI')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🔮 KIKI-PERSONA-QUOTE',
      '**Action:** Receive arcane gothic quote from KIKI\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'kiki-persona-quote',
  aliases: ['k-kiki-persona-quote', 'kikipersonaquote'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🔮 KIKI-PERSONA-QUOTE',
      '**Command:** `kiki-persona-quote`\\n' +
      '**Description:** Receive arcane gothic quote from KIKI\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
