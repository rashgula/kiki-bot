// KIKI Bot - Chat Activity Leaderboard Command
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Leveling = require('../../utils/leveling.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chatleaderboard')
    .setDescription('🏆 View top ranked text chat members by Chat Level and Messages sent'),

  async execute(interaction) {
    const guild = interaction.guild;
    const topUsers = Leveling.getChatLeaderboard(guild.id, 10);

    if (topUsers.length === 0) {
      return interaction.reply({
        embeds: [KikiEmbed.warn('Leaderboard Empty', 'Abhi tak kisi member ne text chat me XP earn nahi kiya hai. Chat channels me baat karein!')]
      });
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const lines = topUsers.map((u, i) => {
      const medal = medals[i] || `\`#${i + 1}\``;
      return `${medal} <@${u.userId}> — **Chat Level ${u.chatLevel}** (\`${u.chatXp.toLocaleString()} XP\` • \`${u.messages.toLocaleString()} msgs\`)`;
    });

    const embed = KikiEmbed.build({
      title: `💬 ${guild.name} • Chat Activity Leaderboard Top 10`,
      description: lines.join('\n\n'),
      color: config.COLORS.TEAL || 0x1ABC9C,
      footer: { text: `Earn Chat XP by chatting actively in text channels! • KIKI v${config.BOT_VERSION}` }
    });

    await interaction.reply({ embeds: [embed] });
  },

  name: 'chatleaderboard',
  aliases: ['chatlb', 'chattop', 'clb'],
  async run(message) {
    const guild = message.guild;
    const topUsers = Leveling.getChatLeaderboard(guild.id, 10);

    if (topUsers.length === 0) {
      return message.reply({
        embeds: [KikiEmbed.warn('Leaderboard Empty', 'Abhi tak kisi member ne text chat me XP earn nahi kiya hai. Chat channels me baat karein!')]
      });
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const lines = topUsers.map((u, i) => {
      const medal = medals[i] || `\`#${i + 1}\``;
      return `${medal} <@${u.userId}> — **Chat Level ${u.chatLevel}** (\`${u.chatXp.toLocaleString()} XP\` • \`${u.messages.toLocaleString()} msgs\`)`;
    });

    const embed = KikiEmbed.build({
      title: `💬 ${guild.name} • Chat Activity Leaderboard Top 10`,
      description: lines.join('\n\n'),
      color: config.COLORS.TEAL || 0x1ABC9C,
      footer: { text: `Earn Chat XP by chatting actively in text channels! • KIKI v${config.BOT_VERSION}` }
    });

    message.reply({ embeds: [embed] });
  }
};
