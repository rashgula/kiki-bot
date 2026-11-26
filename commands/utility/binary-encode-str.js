const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

function toBinary(text) {
  return [...Buffer.from(text, 'utf8')].map(b => b.toString(2).padStart(8, '0')).join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('binary-encode-str')
    .setDescription('💾 Convert text into 8-bit binary')
    .addStringOption(o => o.setName('text').setDescription('Text to encode').setRequired(true)),

  aliases: ['k-binary-encode-str', 'binaryencodestr', 'binaryencode'],
  name: 'binary-encode-str',

  async execute(interaction) {
    const out = toBinary(interaction.options.getString('text'));
    await interaction.reply({ embeds: [KikiEmbed.purple('💾 Binary Encoded', `\`\`\`\n${out.slice(0, 1900)}\n\`\`\``)] });
  },

  async run(message, args) {
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [KikiEmbed.warn('Usage', '`&binaryencode KIKI`')] });
    const out = toBinary(text);
    message.reply({ embeds: [KikiEmbed.purple('💾 Binary Encoded', `\`\`\`\n${out.slice(0, 1900)}\n\`\`\``)] });
  }
};
