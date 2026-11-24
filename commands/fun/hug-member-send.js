const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug-member-send')
    .setDescription('🤗 Give a warm gothic hug to a member')
    .addUserOption(o => o.setName('user').setDescription('Member').setRequired(true)),

  aliases: ['hug'],
  name: 'hug-member-send',

  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const act = FunEngine.getAction('hug', interaction.user.username, target?.username || 'themselves');
    const embed = KikiEmbed.purple('Gothic Embrace 🤗', act.text).setImage(act.gif);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const target = (message.mentions?.users?.first ? message.mentions.users.first() : null);
    const act = FunEngine.getAction('hug', message.author.username, target?.username || 'the shadows');
    const embed = KikiEmbed.purple('Gothic Embrace 🤗', act.text).setImage(act.gif);
    message.reply({ embeds: [embed] });
  }
};
