const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('base64-decode-str')
    .setDescription('🔓 Decode Base64 string back to plain text')
    .addStringOption(o => o.setName('encoded').setDescription('Base64 text').setRequired(true)),

  aliases: ['k-base64-decode-str', 'base64decodestr', 'base64decode', 'b64decode'],
  name: 'base64-decode-str',

  async execute(interaction) {
    const raw = interaction.options.getString('encoded').trim();
    const out = Buffer.from(raw, 'base64').toString('utf8');
    await interaction.reply({ embeds: [KikiEmbed.purple('🔓 Base64 Decoded', `\`\`\`\n${out.slice(0, 1900)}\n\`\`\``)] });
  },

  async run(message, args) {
    const raw = args.join(' ').trim();
    if (!raw) return message.reply({ embeds: [KikiEmbed.warn('Usage', '`&base64decode aGVsbG8=`')] });
    const out = Buffer.from(raw, 'base64').toString('utf8');
    message.reply({ embeds: [KikiEmbed.purple('🔓 Base64 Decoded', `\`\`\`\n${out.slice(0, 1900)}\n\`\`\``)] });
  }
};
