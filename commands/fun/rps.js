const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('rps').setDescription('✂️ Play Rock Paper Scissors against KIKI')
    .addStringOption(o => o.setName('choice').setDescription('Rock, Paper, or Scissors').setRequired(true).addChoices(
      { name: 'Rock 🪨', value: 'rock' },
      { name: 'Paper 📄', value: 'paper' },
      { name: 'Scissors ✂️', value: 'scissors' }
    )),
  async execute(interaction) {
    const user = interaction.options.getString('choice');
    const choices = ['rock', 'paper', 'scissors'];
    const bot = choices[Math.floor(Math.random() * 3)];
    let res;
    if (user === bot) res = "It's a Tie! 🤝";
    else if ((user === 'rock' && bot === 'scissors') || (user === 'paper' && bot === 'rock') || (user === 'scissors' && bot === 'paper')) {
      res = 'You Win! 🎉';
    } else res = 'KIKI Wins! 🔮';
    await interaction.reply({ embeds: [KikiEmbed.purple('✂️ Rock Paper Scissors', `You: **${user}** | KIKI: **${bot}**\n\n**${res}**`)] });
  },
  name: 'rps', aliases: [],
  async run(message, args) {
    const user = args[0]?.toLowerCase();
    if (!['rock', 'paper', 'scissors'].includes(user)) return message.reply('Choose: rock, paper, or scissors');
    const bot = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
    message.reply({ embeds: [KikiEmbed.purple('RPS', `You: ${user} | KIKI: ${bot}`)] });
  }
};
