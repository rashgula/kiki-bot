const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('cursed-haiku-gen')
    .setDescription('📜 Generate eerie three-line gothic haiku')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('📜 CURSED-HAIKU-GEN',
      '**Action:** Generate eerie three-line gothic haiku\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'cursed-haiku-gen',
  aliases: ['k-cursed-haiku-gen', 'cursedhaikugen'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('📜 CURSED-HAIKU-GEN',
      '**Command:** `cursed-haiku-gen`\n' +
      '**Description:** Generate eerie three-line gothic haiku\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
