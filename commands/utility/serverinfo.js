const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('🏰 Server statistics & information'),
  async execute(interaction) {
    const g = interaction.guild;
    const owner = await g.fetchOwner();
    const embed = KikiEmbed.purple(`Server Info - ${g.name}`, `ID: \`${g.id}\``)
      .setThumbnail(g.iconURL({ dynamic: true }))
      .addFields(
        { name: '👑 Owner', value: `${owner.user.tag} (<@${g.ownerId}>)`, inline: true },
        { name: '👥 Members', value: `${g.memberCount}`, inline: true },
        { name: '✨ Boost Level', value: `Level ${g.premiumTier} (${g.premiumSubscriptionCount} boosts)`, inline: true },
        { name: '💬 Channels', value: `${g.channels.cache.size}`, inline: true },
        { name: '🏷️ Roles', value: `${g.roles.cache.size}`, inline: true },
        { name: '📅 Created On', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'serverinfo', aliases: ['si'],
  async run(message) {
    const g = message.guild;
    message.reply({ embeds: [KikiEmbed.purple(`Server Info - ${g.name}`).addFields({ name: 'Members', value: `${g.memberCount}`, inline: true })] });
  }
};
