const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('crime-heist-attempt')
    .setDescription('🕶️ Attempt daring heist for high reward')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🕶️ CRIME-HEIST-ATTEMPT',
      '**Action:** Attempt daring heist for high reward\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'crime-heist-attempt',
  aliases: ['k-crime-heist-attempt', 'crimeheistattempt'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🕶️ CRIME-HEIST-ATTEMPT',
      '**Command:** `crime-heist-attempt`\\n' +
      '**Description:** Attempt daring heist for high reward\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
