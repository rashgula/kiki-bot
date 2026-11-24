const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('duel-challenge-fight')
    .setDescription('⚔️ Engage friend in turn-based mock RPG duel')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('⚔️ DUEL-CHALLENGE-FIGHT',
      '**Action:** Engage friend in turn-based mock RPG duel\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'duel-challenge-fight',
  aliases: ['k-duel-challenge-fight', 'duelchallengefight'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('⚔️ DUEL-CHALLENGE-FIGHT',
      '**Command:** `duel-challenge-fight`\n' +
      '**Description:** Engage friend in turn-based mock RPG duel\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
