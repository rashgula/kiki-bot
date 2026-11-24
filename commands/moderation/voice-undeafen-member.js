const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('voice-undeafen-member')
    .setDescription('🔊 Remove server deafen from member in voice')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🔊 VOICE-UNDEAFEN-MEMBER',
      '**Action:** Remove server deafen from member in voice\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'voice-undeafen-member',
  aliases: ['k-voice-undeafen-member', 'voiceundeafenmember'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🔊 VOICE-UNDEAFEN-MEMBER',
      '**Command:** `voice-undeafen-member`\n' +
      '**Description:** Remove server deafen from member in voice\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
