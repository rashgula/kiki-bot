// KIKI Bot - Voice Leaderboard Command
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Leveling = require('../../utils/leveling.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 View top ranked Voice Chat members by Level and Voice Time'),

  async execute(interaction) {
    const guild = interaction.guild;
    const topUsers = Leveling.getLeaderboard(guild.id, 10);

    if (topUsers.length === 0) {
      return interaction.reply({
        embeds: [KikiEmbed.warn('Leaderboard Empty', 'Abhi tak kisi member ne voice chat me XP earn nahi kiya hai. Voice channel join karein!')]
      });
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const lines = topUsers.map((u, i) => {
      const medal = medals[i] || `\`#${i + 1}\``;
      const timeStr = Leveling.formatVoiceTime(u.voiceTime);
      return `${medal} <@${u.userId}> — **Level ${u.level}** (\`${u.xp.toLocaleString()} XP\` • \`${timeStr}\`)`;
    });

    const embed = KikiEmbed.build({
      title: `🏆 ${guild.name} • Voice Leaderboard Top 10`,
      description: lines.join('\n\n'),
      color: config.COLORS.PRIMARY || 0x9B59B6,
      footer: { text: `Earn XP by talking or chilling in Voice Channels! • KIKI v${config.BOT_VERSION}` }
    });

    await interaction.reply({ embeds: [embed] });
  },

  name: 'leaderboard',
  aliases: ['vctop', 'top', 'lb', 'vcleaderboard'],
  async run(message) {
    const guild = message.guild;
    const topUsers = Leveling.getLeaderboard(guild.id, 10);

    if (topUsers.length === 0) {
      return message.reply({
        embeds: [KikiEmbed.warn('Leaderboard Empty', 'Abhi tak kisi member ne voice chat me XP earn nahi kiya hai. Voice channel join karein!')]
      });
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const lines = topUsers.map((u, i) => {
      const medal = medals[i] || `\`#${i + 1}\``;
      const timeStr = Leveling.formatVoiceTime(u.voiceTime);
      return `${medal} <@${u.userId}> — **Level ${u.level}** (\`${u.xp.toLocaleString()} XP\` • \`${timeStr}\`)`;
    });

    const embed = KikiEmbed.build({
      title: `🏆 ${guild.name} • Voice Leaderboard Top 10`,
      description: lines.join('\n\n'),
      color: config.COLORS.PRIMARY || 0x9B59B6,
      footer: { text: `Earn XP by talking or chilling in Voice Channels! • KIKI v${config.BOT_VERSION}` }
    });

    message.reply({ embeds: [embed] });
  }
};
