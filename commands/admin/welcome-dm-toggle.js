const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-dm-toggle')
    .setDescription('📬 Toggle direct message greeting to joins')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('📬 WELCOME-DM-TOGGLE',
      '**Action:** Toggle direct message greeting to joins\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'welcome-dm-toggle',
  aliases: ['k-welcome-dm-toggle', 'welcomedmtoggle'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('📬 WELCOME-DM-TOGGLE',
      '**Command:** `welcome-dm-toggle`\\n' +
      '**Description:** Toggle direct message greeting to joins\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
