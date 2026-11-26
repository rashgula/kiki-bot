const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
  ' ': '/'
};

function encodeMorse(text) {
  return String(text || '').toUpperCase().split('').map(c => MORSE[c] || '?').join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('morse-encode-str')
    .setDescription('📡 Translate text into Morse code')
    .addStringOption(o => o.setName('text').setDescription('Plain text').setRequired(true)),

  aliases: ['k-morse-encode-str', 'morseencodestr', 'morseencode'],
  name: 'morse-encode-str',

  async execute(interaction) {
    const out = encodeMorse(interaction.options.getString('text'));
    await interaction.reply({ embeds: [KikiEmbed.purple('📡 Morse Code', `\`\`\`\n${out.slice(0, 1900)}\n\`\`\``)] });
  },

  async run(message, args) {
    if (!args.length) return message.reply({ embeds: [KikiEmbed.warn('Usage', '`&morseencode SOS`')] });
    const out = encodeMorse(args.join(' '));
    message.reply({ embeds: [KikiEmbed.purple('📡 Morse Code', `\`\`\`\n${out.slice(0, 1900)}\n\`\`\``)] });
  }
};
