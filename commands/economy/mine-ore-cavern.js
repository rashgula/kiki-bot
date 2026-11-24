const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('mine-ore-cavern')
    .setDescription('⛏️ Dig deep in crystal cavern for amethyst gems')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('⛏️ MINE-ORE-CAVERN',
      '**Action:** Dig deep in crystal cavern for amethyst gems\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'mine-ore-cavern',
  aliases: ['k-mine-ore-cavern', 'mineorecavern'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('⛏️ MINE-ORE-CAVERN',
      '**Command:** `mine-ore-cavern`\n' +
      '**Description:** Dig deep in crystal cavern for amethyst gems\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
