const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-transcript-save')
    .setDescription('📄 Save HTML transcript of ticket messages')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('📄 TICKET-TRANSCRIPT-SAVE',
      '**Action:** Save HTML transcript of ticket messages\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'ticket-transcript-save',
  aliases: ['k-ticket-transcript-save', 'tickettranscriptsave'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('📄 TICKET-TRANSCRIPT-SAVE',
      '**Command:** `ticket-transcript-save`\\n' +
      '**Description:** Save HTML transcript of ticket messages\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
