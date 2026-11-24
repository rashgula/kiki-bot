const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps-challenge-bot')
    .setDescription('✂️ Play Rock Paper Scissors against KIKI')
    .addStringOption(o => o.setName('choice').setDescription('rock, paper, or scissors').setRequired(true)),

  aliases: ['rps', 'rockpaperscissors'],
  name: 'rps-challenge-bot',

  async execute(interaction, client) {
    const choice = interaction.options.getString('choice');
    const res = FunEngine.playRPS(choice);
    const embed = res.result === 'win' ?
      KikiEmbed.success('You Won! 🎉', `You chose **${res.user}** | KIKI chose **${res.bot}**\n\`${res.message}\``) :
      res.result === 'lose' ?
      KikiEmbed.error('KIKI Won! 💀', `You chose **${res.user}** | KIKI chose **${res.bot}**\n\`${res.message}\``) :
      KikiEmbed.purple('It\'s a Tie! 🤝', `Both chose **${res.user}**\n\`${res.message}\``);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const choice = args[0] || 'rock';
    const res = FunEngine.playRPS(choice);
    const embed = res.result === 'win' ?
      KikiEmbed.success('You Won! 🎉', `You chose **${res.user}** | KIKI chose **${res.bot}**\n\`${res.message}\``) :
      res.result === 'lose' ?
      KikiEmbed.error('KIKI Won! 💀', `You chose **${res.user}** | KIKI chose **${res.bot}**\n\`${res.message}\``) :
      KikiEmbed.purple('It\'s a Tie! 🤝', `Both chose **${res.user}**\n\`${res.message}\``);
    message.reply({ embeds: [embed] });
  }
};
