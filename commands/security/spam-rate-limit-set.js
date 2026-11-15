const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('spam-rate-limit-set')
    .setDescription('⚡ Set maximum messages per 5 seconds limit')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('⚡ SPAM-RATE-LIMIT-SET',
      '**Action:** Set maximum messages per 5 seconds limit\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'spam-rate-limit-set',
  aliases: ['k-spam-rate-limit-set', 'spamratelimitset'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('⚡ SPAM-RATE-LIMIT-SET',
      '**Command:** `spam-rate-limit-set`\\n' +
      '**Description:** Set maximum messages per 5 seconds limit\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
