const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite-blocker-toggle')
    .setDescription('🚫 Toggle automatic invite link destruction')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🚫 INVITE-BLOCKER-TOGGLE',
      '**Action:** Toggle automatic invite link destruction\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'invite-blocker-toggle',
  aliases: ['k-invite-blocker-toggle', 'inviteblockertoggle'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🚫 INVITE-BLOCKER-TOGGLE',
      '**Command:** `invite-blocker-toggle`\\n' +
      '**Description:** Toggle automatic invite link destruction\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
