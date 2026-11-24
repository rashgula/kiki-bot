const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slap-member-send')
    .setDescription('👋 Deliver a swift slap')
    .addUserOption(o => o.setName('user').setDescription('Member').setRequired(true)),

  aliases: ['slap'],
  name: 'slap-member-send',

  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const act = FunEngine.getAction('slap', interaction.user.username, target?.username || 'themselves');
    const embed = KikiEmbed.error('Shadow Slap! 👋', act.text).setImage(act.gif);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const target = message.mentions.users.first();
    const act = FunEngine.getAction('slap', message.author.username, target?.username || 'themselves');
    const embed = KikiEmbed.error('Shadow Slap! 👋', act.text).setImage(act.gif);
    message.reply({ embeds: [embed] });
  }
};
