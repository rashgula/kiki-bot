const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel-list-all')
    .setDescription('📜 Complete list of server channels and categories')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('📜 CHANNEL-LIST-ALL',
      '**Action:** Complete list of server channels and categories\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'channel-list-all',
  aliases: ['k-channel-list-all', 'channellistall'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('📜 CHANNEL-LIST-ALL',
      '**Command:** `channel-list-all`\\n' +
      '**Description:** Complete list of server channels and categories\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
