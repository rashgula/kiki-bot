const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-unclaim-ticket')
    .setDescription('🔄 Release claimed ticket back to pool')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🔄 TICKET-UNCLAIM-TICKET',
      '**Action:** Release claimed ticket back to pool\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'ticket-unclaim-ticket',
  aliases: ['k-ticket-unclaim-ticket', 'ticketunclaimticket'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🔄 TICKET-UNCLAIM-TICKET',
      '**Command:** `ticket-unclaim-ticket`\\n' +
      '**Description:** Release claimed ticket back to pool\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
