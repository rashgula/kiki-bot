const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('captcha-verify-toggle')
    .setDescription('🤖 Toggle automatic CAPTCHA verification gate')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🤖 CAPTCHA-VERIFY-TOGGLE',
      '**Action:** Toggle automatic CAPTCHA verification gate\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'captcha-verify-toggle',
  aliases: ['k-captcha-verify-toggle', 'captchaverifytoggle'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🤖 CAPTCHA-VERIFY-TOGGLE',
      '**Command:** `captcha-verify-toggle`\\n' +
      '**Description:** Toggle automatic CAPTCHA verification gate\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
