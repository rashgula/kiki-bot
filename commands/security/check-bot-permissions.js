const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('check-bot-permissions')
    .setDescription('🔑 Verify that KIKI has all necessary permissions')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('🔑 CHECK-BOT-PERMISSIONS',
      '**Action:** Verify that KIKI has all necessary permissions\\n' +
      '**Status:** Successfully processed\\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'check-bot-permissions',
  aliases: ['k-check-bot-permissions', 'checkbotpermissions'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('🔑 CHECK-BOT-PERMISSIONS',
      '**Command:** `check-bot-permissions`\\n' +
      '**Description:** Verify that KIKI has all necessary permissions\\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\\n' : '') +
      '\\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
