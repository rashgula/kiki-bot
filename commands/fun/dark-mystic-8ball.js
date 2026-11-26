const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dark-mystic-8ball')
    .setDescription('🎱 Ask the dark mystic 8-ball a question')
    .addStringOption(o => o.setName('question').setDescription('Your yes/no question')),

  aliases: ['k-dark-mystic-8ball', 'darkmystic8ball'],
  name: 'dark-mystic-8ball',

  async execute(interaction) {
    const res = FunEngine.get8Ball(interaction.options.getString('question'));
    await interaction.reply({ embeds: [KikiEmbed.purple('🎱 Dark Mystic 8-Ball', `**Q:** *${res.question}*\n**A:** ${res.answer}`)] });
  },

  async run(message, args) {
    const res = FunEngine.get8Ball(args.join(' '));
    message.reply({ embeds: [KikiEmbed.purple('🎱 Dark Mystic 8-Ball', `**Q:** *${res.question}*\n**A:** ${res.answer}`)] });
  }
};
