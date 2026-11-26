const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../../data/warnings.json');

function loadWarnings() {
  if (!fs.existsSync(warningsPath)) return {};
  try { return JSON.parse(fs.readFileSync(warningsPath, 'utf8')); }
  catch { return {}; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View all warnings for a user.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to check warnings for').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const warnings = loadWarnings();
    const userWarnings = warnings[user.id] || [];

    if (userWarnings.length === 0) {
      return interaction.reply({ embeds: [KikiEmbed.info('No Warnings', `**${user.tag}** has no warnings on record.`)] });
    }

    const description = userWarnings
      .map((w, i) => `**${i + 1}.** ${w.reason}\n> *By ${w.moderator} • <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R>*`)
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`⚠️ Warnings for ${user.tag}`)
      .setDescription(description)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `KIKI • Total Warnings: ${userWarnings.length}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  name: 'warnings',
  aliases: ['warns', 'warnlist'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Moderate Members** permission.')] });
    }
    const target = message.mentions?.users?.first?.() || (args[0] ? await client.users.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [KikiEmbed.error('Invalid User', 'Please mention a user.')] });

    const warnings = loadWarnings();
    const userWarnings = warnings[target.id] || [];

    if (userWarnings.length === 0) {
      return message.reply({ embeds: [KikiEmbed.info('No Warnings', `**${target.tag}** has no warnings on record.`)] });
    }

    const description = userWarnings
      .map((w, i) => `**${i + 1}.** ${w.reason}\n> *By ${w.moderator} • <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R>*`)
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`⚠️ Warnings for ${target.tag}`)
      .setDescription(description)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `KIKI • Total Warnings: ${userWarnings.length}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
