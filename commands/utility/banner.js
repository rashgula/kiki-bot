const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('banner').setDescription('🖼️ View user or server banner')
    .addUserOption(o => o.setName('user').setDescription('Target user')),
  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;
    const fetched = await client.users.fetch(user.id, { force: true });
    if (!fetched.banner) {
      return interaction.reply({ embeds: [KikiEmbed.info('No Banner', `${user.username} ke paas custom banner nahi hai.`)], ephemeral: true });
    }
    const url = fetched.bannerURL({ size: 1024, dynamic: true });
    const embed = KikiEmbed.purple(`${user.username}'s Banner`, `[Open Link](${url})`).setImage(url);
    await interaction.reply({ embeds: [embed] });
  },
  name: 'banner', aliases: ['ubanner'],
  async run(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    const fetched = await client.users.fetch(user.id, { force: true });
    if (!fetched.banner) return message.reply('No banner found.');
    message.reply({ embeds: [KikiEmbed.purple(`${user.username}'s Banner`).setImage(fetched.bannerURL({ size: 1024 }))] });
  }
};
