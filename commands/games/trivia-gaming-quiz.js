const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia-gaming-quiz')
    .setDescription('🎮 Answer video game lore and history trivia')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🎮 TRIVIA-GAMING-QUIZ',
      '**Action:** Answer video game lore and history trivia\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'trivia-gaming-quiz',
  aliases: ['k-trivia-gaming-quiz', 'triviagamingquiz'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🎮 TRIVIA-GAMING-QUIZ',
      '**Command:** `trivia-gaming-quiz`\\n' +
      '**Description:** Answer video game lore and history trivia\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
