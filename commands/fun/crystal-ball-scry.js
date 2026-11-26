const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crystal-ball-scry')
    .setDescription('🔮 Gaze into the crystal ball for an omen')
    .addStringOption(o => o.setName('question').setDescription('What do you wish to foresee?')),

  aliases: ['k-crystal-ball-scry', 'crystalballscry', 'scry'],
  name: 'crystal-ball-scry',

  async execute(interaction) {
    const q = interaction.options.getString('question');
    const res = FunEngine.get8Ball(q);
    await interaction.reply({ embeds: [KikiEmbed.purple('🔮 Crystal Ball Scry', `**Question:** *${res.question}*\n**Vision:** ${res.answer}`)] });
  },

  async run(message, args) {
    const res = FunEngine.get8Ball(args.join(' '));
    message.reply({ embeds: [KikiEmbed.purple('🔮 Crystal Ball Scry', `**Question:** *${res.question}*\n**Vision:** ${res.answer}`)] });
  }
};
