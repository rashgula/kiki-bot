const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar-user-view')
    .setDescription('🖼️ View high-resolution avatar of any user')
    .addUserOption(o => o.setName('user').setDescription('Target member')),

  aliases: ['k-avatar-user-view', 'avataruserview'],
  name: 'avatar-user-view',

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const url = user.displayAvatarURL({ size: 1024, dynamic: true });
    await interaction.reply({ embeds: [KikiEmbed.purple(`🖼️ ${user.username}'s Avatar`, `[Open Image](${url})`).setImage(url)] });
  },

  async run(message, args, client) {
    const cleanId = args[0]?.replace(/[<@!>]/g, '');
    const user = message.mentions?.users?.first?.()
      || (cleanId && /^\d{17,20}$/.test(cleanId) ? await client.users.fetch(cleanId).catch(() => null) : null)
      || message.author;
    const url = user.displayAvatarURL({ size: 1024, dynamic: true });
    message.reply({ embeds: [KikiEmbed.purple(`🖼️ ${user.username}'s Avatar`, `[Open Image](${url})`).setImage(url)] });
  }
};
