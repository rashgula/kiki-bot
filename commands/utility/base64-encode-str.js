const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('base64-encode-str')
    .setDescription('🔐 Encode plain text into Base64')
    .addStringOption(o => o.setName('text').setDescription('Text to encode').setRequired(true)),

  aliases: ['k-base64-encode-str', 'base64encodestr', 'base64encode', 'b64encode'],
  name: 'base64-encode-str',

  async execute(interaction) {
    const text = interaction.options.getString('text');
    const out = Buffer.from(text, 'utf8').toString('base64');
    await interaction.reply({ embeds: [KikiEmbed.purple('🔐 Base64 Encoded', `\`\`\`\n${out.slice(0, 1900)}\n\`\`\``)] });
  },

  async run(message, args) {
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [KikiEmbed.warn('Usage', '`&base64encode hello world`')] });
    const out = Buffer.from(text, 'utf8').toString('base64');
    message.reply({ embeds: [KikiEmbed.purple('🔐 Base64 Encoded', `\`\`\`\n${out.slice(0, 1900)}\n\`\`\``)] });
  }
};
