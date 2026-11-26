const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

function buildRoleList(guild) {
  const roles = [...guild.roles.cache.values()]
    .filter(r => r.id !== guild.id)
    .sort((a, b) => b.position - a.position);
  const lines = roles.slice(0, 35).map(r => `${r.toString()} — \`${r.members.size} members\``).join('\n');
  return KikiEmbed.purple(`🏷️ Server Roles • ${guild.name} (${roles.length})`,
    (lines || 'No roles') + (roles.length > 35 ? `\n\n*...and ${roles.length - 35} more roles*` : '')
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role-list-all')
    .setDescription('🏷️ List all roles in this server sorted by hierarchy'),

  aliases: ['k-role-list-all', 'rolelistall', 'roles'],
  name: 'role-list-all',

  async execute(interaction) {
    await interaction.reply({ embeds: [buildRoleList(interaction.guild)] });
  },

  async run(message) {
    message.reply({ embeds: [buildRoleList(message.guild)] });
  }
};
