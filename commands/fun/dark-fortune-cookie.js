const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('dark-fortune-cookie')
    .setDescription('🥠 Open mysterious gothic fortune slip')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🥠 DARK-FORTUNE-COOKIE',
      '**Action:** Open mysterious gothic fortune slip\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'dark-fortune-cookie',
  aliases: ['k-dark-fortune-cookie', 'darkfortunecookie'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🥠 DARK-FORTUNE-COOKIE',
      '**Command:** `dark-fortune-cookie`\\n' +
      '**Description:** Open mysterious gothic fortune slip\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
