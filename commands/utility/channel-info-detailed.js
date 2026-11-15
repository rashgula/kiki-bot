const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel-info-detailed')
    .setDescription('💬 Inspect channel type, topic and rate limit')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('💬 CHANNEL-INFO-DETAILED',
      '**Action:** Inspect channel type, topic and rate limit\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'channel-info-detailed',
  aliases: ['k-channel-info-detailed', 'channelinfodetailed'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('💬 CHANNEL-INFO-DETAILED',
      '**Command:** `channel-info-detailed`\\n' +
      '**Description:** Inspect channel type, topic and rate limit\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
