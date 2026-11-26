// KIKI Bot - Invites Leaderboard Command
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const InviteTracker = require('../../utils/inviteTracker.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invitetop')
    .setDescription('🏆 View Top 10 Inviters in the server'),

  async execute(interaction, client) {
    const top = InviteTracker.getLeaderboard(interaction.guild.id, 10);

    if (!top || top.length === 0) {
      return interaction.reply({
        embeds: [KikiEmbed.info('Invite Leaderboard 🏆', 'Abhi tak is server me kisi ne invite record nahi kiya hai!')]
      });
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const lines = top.map((entry, index) => {
      const medal = medals[index] || `\`#${index + 1}\``;
      return `${medal} <@${entry.userId}> — **${entry.total}** Total *(🟢 ${entry.regular} Active | 🚪 ${entry.left} Left)*`;
    });

    const embed = KikiEmbed.build({
      title: `🏆 Top Inviters • ${interaction.guild.name}`,
      description: `Server me sabse zyada invites karne wale top members:\n\n` + lines.join('\n'),
      color: config.COLORS.PURPLE || 0x9B59B6,
      footer: { text: `KIKI Invite Tracker • Leaderboard` },
      timestamp: true
    });

    await interaction.reply({ embeds: [embed] });
  },

  name: 'invitetop',
  aliases: ['invitelb', 'inviteleaderboard', 'topinvites', 'topinv', 'invtop'],
  description: 'View Top 10 Inviters in the server',
  category: 'utility',
  usage: '&invitetop',

  async run(message, args, client) {
    const top = InviteTracker.getLeaderboard(message.guild.id, 10);

    if (!top || top.length === 0) {
      return message.channel.send({
        embeds: [KikiEmbed.info('Invite Leaderboard 🏆', 'Abhi tak is server me kisi ne invite record nahi kiya hai!')]
      });
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const lines = top.map((entry, index) => {
      const medal = medals[index] || `\`#${index + 1}\``;
      return `${medal} <@${entry.userId}> — **${entry.total}** Total *(🟢 ${entry.regular} Active | 🚪 ${entry.left} Left)*`;
    });

    const embed = KikiEmbed.build({
      title: `🏆 Top Inviters • ${message.guild.name}`,
      description: `Server me sabse zyada invites karne wale top members:\n\n` + lines.join('\n'),
      color: config.COLORS.PURPLE || 0x9B59B6,
      footer: { text: `KIKI Invite Tracker • Leaderboard` },
      timestamp: true
    });

    await message.channel.send({ embeds: [embed] });
  }
};
