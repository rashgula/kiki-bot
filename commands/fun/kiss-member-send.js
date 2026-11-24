const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kiss-member-send')
    .setDescription('💋 Give a sweet gothic kiss to a member')
    .addUserOption(o => o.setName('user').setDescription('Member').setRequired(true)),

  aliases: ['kiss'],
  name: 'kiss-member-send',

  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const act = FunEngine.getAction('kiss', interaction.user.username, target?.username || 'the air');
    const embed = KikiEmbed.purple('Gothic Kiss 💋', act.text).setImage(act.gif);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const target = message.mentions.users.first();
    const act = FunEngine.getAction('kiss', message.author.username, target?.username || 'the air');
    const embed = KikiEmbed.purple('Gothic Kiss 💋', act.text).setImage(act.gif);
    message.reply({ embeds: [embed] });
  }
};
