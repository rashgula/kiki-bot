const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

const responses = [
  '🔮 It is decidedly so.',
  '💜 Without a doubt in the shadows.',
  '✨ Yes – definitely.',
  '🌙 Signs point to yes.',
  '🕷️ Reply hazy, consult the abyss again.',
  '🦇 Ask again under the moonlight.',
  '❌ Better not tell you now.',
  '💀 My dark sources say no.',
  '🖤 Very doubtful.'
];

module.exports = {
  data: new SlashCommandBuilder().setName('8ball').setDescription('🔮 Ask the dark crystal ball a question')
    .addStringOption(o => o.setName('question').setDescription('Your question').setRequired(true)),
  async execute(interaction) {
    const q = interaction.options.getString('question');
    const answer = responses[Math.floor(Math.random() * responses.length)];
    const embed = KikiEmbed.purple('🔮 Mystic 8-Ball', `**Question:** ${q}\n**Answer:** ${answer}`);
    await interaction.reply({ embeds: [embed] });
  },
  name: '8ball', aliases: ['eightball'],
  async run(message, args) {
    const q = args.join(' ');
    if (!q) return message.reply('Sawaal toh pucho!');
    const answer = responses[Math.floor(Math.random() * responses.length)];
    message.reply({ embeds: [KikiEmbed.purple('🔮 8-Ball', `**Q:** ${q}\n**A:** ${answer}`)] });
  }
};
