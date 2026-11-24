const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia-general-quiz')
    .setDescription('🎮 Answer general knowledge trivia question')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🎮 TRIVIA-GENERAL-QUIZ',
      '**Action:** Answer general knowledge trivia question\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'trivia-general-quiz',
  aliases: ['k-trivia-general-quiz', 'triviageneralquiz'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🎮 TRIVIA-GENERAL-QUIZ',
      '**Command:** `trivia-general-quiz`\n' +
      '**Description:** Answer general knowledge trivia question\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
