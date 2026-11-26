const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role-add')
    .setDescription('Add a role to a member.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to add the role to').setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('role').setDescription('The role to add').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) return interaction.reply({ embeds: [KikiEmbed.error('Not Found', 'That user is not in this server.')], ephemeral: true });
    if (role.managed) return interaction.reply({ embeds: [KikiEmbed.error('Managed Role', 'This role is managed by an integration and cannot be assigned.')], ephemeral: true });
    if (interaction.guild.members.me.roles.highest.comparePositionTo(role) <= 0) {
      return interaction.reply({ embeds: [KikiEmbed.error('Role Too High', 'I cannot assign a role higher than or equal to my highest role.')], ephemeral: true });
    }
    if (member.roles.cache.has(role.id)) {
      return interaction.reply({ embeds: [KikiEmbed.info('Already Has Role', `**${user.tag}** already has the ${role} role.`)], ephemeral: true });
    }

    try {
      await member.roles.add(role);
      await interaction.reply({ embeds: [KikiEmbed.success('Role Added', `Added ${role} to **${user.tag}**.`)] });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Role Add Failed', err.message)], ephemeral: true });
    }
  },

  name: 'role-add',
  aliases: ['addrole', 'ra'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Manage Roles** permission.')] });
    }
    const target = message.mentions?.members?.first?.() || (args[0] ? message.guild.members.cache.get(args[0].replace(/[<@!>]/g, '')) : null);
    const role = message.mentions?.roles?.first?.() || (args[1] ? message.guild.roles.cache.get(args[1].replace(/[<@&>]/g, '')) : null);
    if (!target || !role) return message.reply({ embeds: [KikiEmbed.error('Invalid Args', 'Usage: `!role-add @user @role`')] });

    if (role.managed) return message.reply({ embeds: [KikiEmbed.error('Managed Role', 'This role cannot be assigned.')] });
    if (message.guild.members.me.roles.highest.comparePositionTo(role) <= 0) {
      return message.reply({ embeds: [KikiEmbed.error('Role Too High', 'I cannot assign that role.')] });
    }
    if (target.roles.cache.has(role.id)) return message.reply({ embeds: [KikiEmbed.info('Already Has Role', `${target} already has that role.`)] });

    try {
      await target.roles.add(role);
      message.reply({ embeds: [KikiEmbed.success('Role Added', `Added ${role} to **${target.user.tag}**.`)] });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Role Add Failed', err.message)] });
    }
  },
};
