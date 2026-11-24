const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('laugh-reaction-emote')
    .setDescription('🤣 Express hilarious amusement with laugh GIF')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🤣 LAUGH-REACTION-EMOTE',
      '**Action:** Express hilarious amusement with laugh GIF\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'laugh-reaction-emote',
  aliases: ['k-laugh-reaction-emote', 'laughreactionemote'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🤣 LAUGH-REACTION-EMOTE',
      '**Command:** `laugh-reaction-emote`\n' +
      '**Description:** Express hilarious amusement with laugh GIF\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
