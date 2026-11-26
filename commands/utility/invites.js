// KIKI Bot - User Invites Stat Command
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const InviteTracker = require('../../utils/inviteTracker.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('📩 Check member invite stats (All-time total, active joins, leaves, and fakes)')
    .addUserOption(o => o.setName('user').setDescription('Target member to check').setRequired(false)),

  async execute(interaction, client) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const stats = InviteTracker.getUserStats(interaction.guild.id, targetUser.id);

    const embed = KikiEmbed.build({
      title: `📩 Invite Stats • ${targetUser.tag}`,
      description:
        `Aapke server me **${targetUser.toString()}** ke invite statistics:\n\n` +
        `👑 **Aaj Tak Total Invites:** \`${stats.total}\` *(All-time recorded joins)*\n` +
        `───────────────────────────────────────\n` +
        `• 🟢 **Active (Server me hain):** \`${stats.regular}\`\n` +
        `• 🚪 **Left (Chhod ke chale gaye):** \`${stats.left}\`\n` +
        `• ⚠️ **Fake / Sus (<3 din purane):** \`${stats.fake}\`\n` +
        `• 🎁 **Bonus Invites (Admin added):** \`${stats.bonus}\`\n` +
        `───────────────────────────────────────\n` +
        `📊 **Net Effective Invites:** \`${stats.effective}\``,
      color: config.COLORS.PURPLE || 0x9B59B6,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      footer: { text: `KIKI Invite Tracker • Requested by ${interaction.user.tag}` },
      timestamp: true
    });

    await interaction.reply({ embeds: [embed] });
  },

  name: 'invites',
  aliases: ['invs', 'myinvites', 'invitetracker-check'],
  description: 'Check your or another member\'s invite stats',
  category: 'utility',
  usage: '&invites [@user]',

  async run(message, args, client) {
    let targetUser = message.author;
    const mentioned = message.mentions?.users?.first?.();
    if (mentioned) {
      targetUser = mentioned;
    } else if (args[0] && /^\d{17,20}$/.test(args[0])) {
      targetUser = await client.users.fetch(args[0]).catch(() => message.author);
    }

    const stats = InviteTracker.getUserStats(message.guild.id, targetUser.id);

    const embed = KikiEmbed.build({
      title: `📩 Invite Stats • ${targetUser.tag}`,
      description:
        `Server me **${targetUser.toString()}** ke invite statistics:\n\n` +
        `👑 **Aaj Tak Total Invites:** \`${stats.total}\` *(All-time recorded joins)*\n` +
        `───────────────────────────────────────\n` +
        `• 🟢 **Active (Server me hain):** \`${stats.regular}\`\n` +
        `• 🚪 **Left (Chhod ke chale gaye):** \`${stats.left}\`\n` +
        `• ⚠️ **Fake / Sus (<3 din purane):** \`${stats.fake}\`\n` +
        `• 🎁 **Bonus Invites (Admin added):** \`${stats.bonus}\`\n` +
        `───────────────────────────────────────\n` +
        `📊 **Net Effective Invites:** \`${stats.effective}\``,
      color: config.COLORS.PURPLE || 0x9B59B6,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      footer: { text: `KIKI Invite Tracker • Requested by ${message.author.tag}` },
      timestamp: true
    });

    await message.channel.send({ embeds: [embed] });
  }
};
