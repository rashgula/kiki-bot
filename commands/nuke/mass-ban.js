// KIKI Bot - Mass Ban Command (by role) | Admin Tool
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mass-ban')
    .setDescription('💜 Ek role ke saare members ko ban karo')
    .addRoleOption(o => o.setName('role').setDescription('Jis role ko ban karna hai').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI_isOwnerOrAdmin(interaction)) return interaction.reply({ embeds: [KikiEmbed.error('Access Denied', 'Admin only!')], ephemeral: true });
    await interaction.deferReply();
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'Mass ban by KIKI admin';
    const guild = interaction.guild;
    await guild.members.fetch();
    const targets = guild.members.cache.filter(m => m.roles.cache.has(role.id) && !m.user.bot);
    let count = 0, failed = 0;
    for (const [, member] of targets) {
      try { await member.ban({ reason }); count++; } catch { failed++; }
    }
    await interaction.editReply({ embeds: [KikiEmbed.nuke('Mass Ban Complete', `✅ Banned: **${count}** members\n❌ Failed: **${failed}**\nRole: ${role.name}`)] });
  },

  name: 'mass-ban',
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
    const role = message.mentions.roles.first();
    if (!role) return message.reply('Role mention karo!');
    await message.guild.members.fetch();
    let count = 0;
    for (const [, m] of message.guild.members.cache.filter(m => m.roles.cache.has(role.id))) {
      try { await m.ban(); count++; } catch {}
    }
    message.reply({ embeds: [KikiEmbed.nuke('Mass Ban', `${count} members banned!`)] });
  },
};

function KIKI_isOwnerOrAdmin(interaction) {
  return interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
    interaction.guild.ownerId === interaction.user.id;
}
