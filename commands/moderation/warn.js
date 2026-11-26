const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../../data/warnings.json');

function loadWarnings() {
  if (!fs.existsSync(warningsPath)) {
    fs.mkdirSync(path.dirname(warningsPath), { recursive: true });
    fs.writeFileSync(warningsPath, '{}', 'utf8');
  }
  try { return JSON.parse(fs.readFileSync(warningsPath, 'utf8')); }
  catch { return {}; }
}

function saveWarnings(data) {
  fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a warning to a member.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to warn').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the warning').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) return interaction.reply({ embeds: [KikiEmbed.error('Not Found', 'That user is not in this server.')], ephemeral: true });
    if (user.bot) return interaction.reply({ embeds: [KikiEmbed.error('Invalid Target', 'You cannot warn a bot.')], ephemeral: true });

    const warnings = loadWarnings();
    if (!warnings[user.id]) warnings[user.id] = [];
    const entry = { reason, moderator: interaction.user.tag, timestamp: new Date().toISOString() };
    warnings[user.id].push(entry);
    saveWarnings(warnings);

    // DM the user
    try {
      await user.send({
        embeds: [KikiEmbed.warn('⚠️ Warning Received',
          `You have received a warning in **${interaction.guild.name}**.\n**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`
        )]
      });
    } catch { /* DMs disabled */ }

    const totalWarnings = warnings[user.id].length;
    await interaction.reply({
      embeds: [KikiEmbed.success('Member Warned',
        `**${user.tag}** has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${totalWarnings}`
      )]
    });
  },

  name: 'warn',
  aliases: ['w'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Moderate Members** permission.')] });
    }
    const target = message.mentions?.users?.first?.() || (args[0] ? await client.users.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [KikiEmbed.error('Invalid User', 'Please mention a user to warn.')] });
    const reason = args.slice(1).join(' ');
    if (!reason) return message.reply({ embeds: [KikiEmbed.error('Missing Reason', 'Please provide a reason for the warning.')] });

    const warnings = loadWarnings();
    if (!warnings[target.id]) warnings[target.id] = [];
    const entry = { reason, moderator: message.author.tag, timestamp: new Date().toISOString() };
    warnings[target.id].push(entry);
    saveWarnings(warnings);

    try {
      await target.send({
        embeds: [KikiEmbed.warn('⚠️ Warning Received',
          `You have received a warning in **${message.guild.name}**.\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`
        )]
      });
    } catch { /* DMs disabled */ }

    const totalWarnings = warnings[target.id].length;
    message.reply({
      embeds: [KikiEmbed.success('Member Warned',
        `**${target.tag}** has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${totalWarnings}`
      )]
    });
  },
};
