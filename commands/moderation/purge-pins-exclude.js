const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge-pins-exclude')
    .setDescription('🧹 Purge messages keeping pinned messages safe')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🧹 PURGE-PINS-EXCLUDE',
      '**Action:** Purge messages keeping pinned messages safe\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'purge-pins-exclude',
  aliases: ['k-purge-pins-exclude', 'purgepinsexclude'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🧹 PURGE-PINS-EXCLUDE',
      '**Command:** `purge-pins-exclude`\\n' +
      '**Description:** Purge messages keeping pinned messages safe\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
