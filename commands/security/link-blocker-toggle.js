const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('link-blocker-toggle')
    .setDescription('🚫 Toggle unauthorized website link filter')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🚫 LINK-BLOCKER-TOGGLE',
      '**Action:** Toggle unauthorized website link filter\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'link-blocker-toggle',
  aliases: ['k-link-blocker-toggle', 'linkblockertoggle'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🚫 LINK-BLOCKER-TOGGLE',
      '**Command:** `link-blocker-toggle`\n' +
      '**Description:** Toggle unauthorized website link filter\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
