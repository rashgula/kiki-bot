// KIKI Bot - Server List Command
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverlist')
    .setDescription('🔮 View all Discord servers KIKI is currently connected to'),

  category: 'utility',

  async execute(interaction, client) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf Bot Owner / Whitelisted users hi bot ke servers dekh sakte hain!')],
        ephemeral: true
      });
    }

    const guilds = Array.from(client.guilds.cache.values());
    const list = guilds.map((g, i) =>
      `**${i + 1}. ${g.name}**\n• 🆔 **ID:** \`${g.id}\`\n• 👥 **Members:** \`${g.memberCount}\`\n• 👑 **Owner ID:** \`${g.ownerId}\``
    ).join('\n\n');

    const totalMembers = guilds.reduce((acc, g) => acc + (g.memberCount || 0), 0);
    const embed = KikiEmbed.purple(
      `🔮 KIKI Connected Servers (${guilds.length})`,
      `**Total Servers:** \`${guilds.length}\` | **Total Users:** \`${totalMembers.toLocaleString()}\`\n\n${list || 'Koi server nahi mila.'}`
    );

    await interaction.reply({ embeds: [embed] });
  },

  name: 'serverlist',
  aliases: ['servers', 'guilds', 'botservers', 'guildlist', 'server-list'],
  async run(message, args, client) {
    if (!KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf Bot Owner / Whitelisted users hi bot ke servers dekh sakte hain!')]
      });
    }

    const guilds = Array.from(client.guilds.cache.values());
    const list = guilds.map((g, i) =>
      `**${i + 1}. ${g.name}**\n• 🆔 **ID:** \`${g.id}\`\n• 👥 **Members:** \`${g.memberCount}\`\n• 👑 **Owner ID:** \`${g.ownerId}\``
    ).join('\n\n');

    const totalMembers = guilds.reduce((acc, g) => acc + (g.memberCount || 0), 0);
    const embed = KikiEmbed.purple(
      `🔮 KIKI Connected Servers (${guilds.length})`,
      `**Total Servers:** \`${guilds.length}\` | **Total Users:** \`${totalMembers.toLocaleString()}\`\n\n${list || 'Koi server nahi mila.'}`
    );

    await message.reply({ embeds: [embed] });
  }
};
