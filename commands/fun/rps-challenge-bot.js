const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps-challenge-bot')
    .setDescription('✂️ Play rock paper scissors against KIKI bot')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('✂️ RPS-CHALLENGE-BOT',
      '**Action:** Play rock paper scissors against KIKI bot\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'rps-challenge-bot',
  aliases: ['k-rps-challenge-bot', 'rpschallengebot'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('✂️ RPS-CHALLENGE-BOT',
      '**Command:** `rps-challenge-bot`\\n' +
      '**Description:** Play rock paper scissors against KIKI bot\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
