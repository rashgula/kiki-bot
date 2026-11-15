const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('dark-meme-fetch')
    .setDescription('🖤 Fetch fresh gothic aesthetic humor meme')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🖤 DARK-MEME-FETCH',
      '**Action:** Fetch fresh gothic aesthetic humor meme\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'dark-meme-fetch',
  aliases: ['k-dark-meme-fetch', 'darkmemefetch'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🖤 DARK-MEME-FETCH',
      '**Command:** `dark-meme-fetch`\\n' +
      '**Description:** Fetch fresh gothic aesthetic humor meme\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
