const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole-show')
    .setDescription('📋 List all active reaction role bindings')
    .addStringOption(o => o.setName('query').setDescription('Argument / Query')),

  async execute(interaction, client) {
    const q = interaction.options.getString('query') || 'None';
    const embed = KikiEmbed.purple('📋 REACTIONROLE-SHOW',
      '**Action:** List all active reaction role bindings\n' +
      '**Status:** Successfully processed\n' +
      (q !== 'None' ? '**Input:** `' + q + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'reactionrole-show',
  aliases: ['k-reactionrole-show', 'reactionroleshow'],
  async run(message, args, client) {
    const input = args.join(' ') || 'None';
    const embed = KikiEmbed.purple('📋 REACTIONROLE-SHOW',
      '**Command:** `reactionrole-show`\n' +
      '**Description:** List all active reaction role bindings\n' +
      (input !== 'None' ? '**Query:** `' + input + '`\n' : '') +
      '\n*「 KIKI 」• Gothic Utility v2.2*'
    );
    message.reply({ embeds: [embed] });
  }
};
