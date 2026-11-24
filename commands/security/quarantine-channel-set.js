const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('quarantine-channel-set')
    .setDescription('⛓️ Set isolation channel for flagged members')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('⛓️ QUARANTINE-CHANNEL-SET',
      '**Action:** Set isolation channel for flagged members\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'quarantine-channel-set',
  aliases: ['k-quarantine-channel-set', 'quarantinechannelset'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('⛓️ QUARANTINE-CHANNEL-SET',
      '**Command:** `quarantine-channel-set`\n' +
      '**Description:** Set isolation channel for flagged members\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
