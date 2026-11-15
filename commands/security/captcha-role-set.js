const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('captcha-role-set')
    .setDescription('✅ Set verified role given upon CAPTCHA pass')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('✅ CAPTCHA-ROLE-SET',
      '**Action:** Set verified role given upon CAPTCHA pass\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'captcha-role-set',
  aliases: ['k-captcha-role-set', 'captcharoleset'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('✅ CAPTCHA-ROLE-SET',
      '**Command:** `captcha-role-set`\\n' +
      '**Description:** Set verified role given upon CAPTCHA pass\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
