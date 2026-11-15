const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('avatar').setDescription('🖼️ View user avatar')
    .addUserOption(o => o.setName('user').setDescription('Target user')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const png = user.displayAvatarURL({ extension: 'png', size: 1024 });
    const embed = KikiEmbed.purple(`${user.username}'s Avatar`, `[PNG](${png}) | [JPG](${user.displayAvatarURL({ extension: 'jpg' })}) | [WEBP](${user.displayAvatarURL({ extension: 'webp' })})`)
      .setImage(png);
    await interaction.reply({ embeds: [embed] });
  },
  name: 'avatar', aliases: ['av', 'pfp'],
  async run(message, args) {
    const user = message.mentions.users.first() || message.author;
    const png = user.displayAvatarURL({ extension: 'png', size: 1024 });
    message.reply({ embeds: [KikiEmbed.purple(`${user.username}'s Avatar`).setImage(png)] });
  }
};
