const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-embed-toggle')
    .setDescription('🖼️ Toggle rich embed card for greetings')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🖼️ WELCOME-EMBED-TOGGLE',
      '**Action:** Toggle rich embed card for greetings\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'welcome-embed-toggle',
  aliases: ['k-welcome-embed-toggle', 'welcomeembedtoggle'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🖼️ WELCOME-EMBED-TOGGLE',
      '**Command:** `welcome-embed-toggle`\n' +
      '**Description:** Toggle rich embed card for greetings\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
