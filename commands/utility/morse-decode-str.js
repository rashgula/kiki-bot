const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

const REV_MORSE = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
  '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
  '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y', '--..': 'Z',
  '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9',
  '/': ' '
};

function decodeMorse(code) {
  return String(code || '').trim().split(/\s+/).map(t => REV_MORSE[t] ?? '').join('');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('morse-decode-str')
    .setDescription('📡 Decode Morse code back to plain text')
    .addStringOption(o => o.setName('morse').setDescription('Morse code separated by spaces').setRequired(true)),

  aliases: ['k-morse-decode-str', 'morsedecodestr', 'morsedecode'],
  name: 'morse-decode-str',

  async execute(interaction) {
    const out = decodeMorse(interaction.options.getString('morse'));
    await interaction.reply({ embeds: [KikiEmbed.purple('📡 Morse Decoded', `\`\`\`\n${(out || '[Invalid morse]').slice(0, 1900)}\n\`\`\``)] });
  },

  async run(message, args) {
    if (!args.length) return message.reply({ embeds: [KikiEmbed.warn('Usage', '`&morsedecode ... --- ...`')] });
    const out = decodeMorse(args.join(' '));
    message.reply({ embeds: [KikiEmbed.purple('📡 Morse Decoded', `\`\`\`\n${(out || '[Invalid morse]').slice(0, 1900)}\n\`\`\``)] });
  }
};
