const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder().setName('setticketstaff').setDescription('🎫 Set Ticket Staff Role')
    .addRoleOption(o => o.setName('role').setDescription('Staff role').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, interaction.client) && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [KikiEmbed.error('Access Denied', 'Administrator permission chahiye!')], ephemeral: true });
    }
    const role = interaction.options.getRole('role');
    KIKI.setGuildConfig(interaction.guild.id, 'staff_role_id', role.id);
    await interaction.reply({ embeds: [KikiEmbed.success('Ticket Staff Set', `✅ Ticket Staff set to **@${role.name}**`)] });
  },
  name: 'setticketstaff', aliases: [],
  async run(message, args, client) {
    if (!KIKI.isSafe(message.guild, message.author.id, client) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ embeds: [KikiEmbed.error('Access Denied', 'Aapke paas Administrator permission honi chahiye!')] });
    }
    const role = message.mentions?.roles?.first?.() || (args[0] ? message.guild.roles.cache.get(args[0].replace(/[<@&>]/g, '')) : null);
    if (!role) return message.reply({ embeds: [KikiEmbed.warn('Role Missing', 'Kripya staff role mention ya ID dein!')] });
    KIKI.setGuildConfig(message.guild.id, 'staff_role_id', role.id);
    message.reply({ embeds: [KikiEmbed.success('Staff Role', `Set to **@${role.name}**`)] });
  }
};
