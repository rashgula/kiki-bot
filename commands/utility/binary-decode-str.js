const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

function fromBinary(bin) {
  const bytes = String(bin || '').trim().split(/\s+/).filter(Boolean).map(b => parseInt(b, 2)).filter(n => !isNaN(n));
  return Buffer.from(bytes).toString('utf8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('binary-decode-str')
    .setDescription('💾 Decode 8-bit binary back into plain text')
    .addStringOption(o => o.setName('binary').setDescription('Space-separated binary bytes').setRequired(true)),

  aliases: ['k-binary-decode-str', 'binarydecodestr', 'binarydecode'],
  name: 'binary-decode-str',

  async execute(interaction) {
    const out = fromBinary(interaction.options.getString('binary'));
    await interaction.reply({ embeds: [KikiEmbed.purple('💾 Binary Decoded', `\`\`\`\n${(out || '[Invalid binary]').slice(0, 1900)}\n\`\`\``)] });
  },

  async run(message, args) {
    if (!args.length) return message.reply({ embeds: [KikiEmbed.warn('Usage', '`&binarydecode 01001011 01001001`')] });
    const out = fromBinary(args.join(' '));
    message.reply({ embeds: [KikiEmbed.purple('💾 Binary Decoded', `\`\`\`\n${(out || '[Invalid binary]').slice(0, 1900)}\n\`\`\``)] });
  }
};
