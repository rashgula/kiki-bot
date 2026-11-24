const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('roulette-spin-wheel')
    .setDescription('🎰 Bet on red, black or number on roulette')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🎰 ROULETTE-SPIN-WHEEL',
      '**Action:** Bet on red, black or number on roulette\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'roulette-spin-wheel',
  aliases: ['k-roulette-spin-wheel', 'roulettespinwheel'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🎰 ROULETTE-SPIN-WHEEL',
      '**Command:** `roulette-spin-wheel`\n' +
      '**Description:** Bet on red, black or number on roulette\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
