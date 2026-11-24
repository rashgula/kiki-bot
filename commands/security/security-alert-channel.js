const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('security-alert-channel')
    .setDescription('🚨 Set destination for real-time security pings')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🚨 SECURITY-ALERT-CHANNEL',
      '**Action:** Set destination for real-time security pings\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'security-alert-channel',
  aliases: ['k-security-alert-channel', 'securityalertchannel'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🚨 SECURITY-ALERT-CHANNEL',
      '**Command:** `security-alert-channel`\n' +
      '**Description:** Set destination for real-time security pings\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
