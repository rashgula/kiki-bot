const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Leveling = require('../../utils/leveling.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level-leaderboard-top')
    .setDescription('🏆 View top active chat members by level'),

  async execute(interaction) {
    const top = Leveling.getChatLeaderboard(interaction.guildId, 10);
    if (!top.length) {
      return interaction.reply({ embeds: [KikiEmbed.info('Chat Leaderboard 🏆', 'Abhi tak kisi ka chat XP record nahi hua!')] });
    }
    const medals = ['🥇', '🥈', '🥉'];
    const lines = top.map((u, i) => `${medals[i] || `\`#${i + 1}\``} <@${u.userId}> — **Lv.${u.chatLevel}** (\`${u.chatXp.toLocaleString()} XP\` • ${u.messages} msgs)`);
    await interaction.reply({ embeds: [KikiEmbed.purple(`🏆 Chat Activity Top 10 • ${interaction.guild.name}`, lines.join('\n'))] });
  },

  name: 'level-leaderboard-top',
  aliases: ['k-level-leaderboard-top', 'levelleaderboardtop'],
  async run(message) {
    const top = Leveling.getChatLeaderboard(message.guild.id, 10);
    if (!top.length) {
      return message.reply({ embeds: [KikiEmbed.info('Chat Leaderboard 🏆', 'Abhi tak kisi ka chat XP record nahi hua!')] });
    }
    const medals = ['🥇', '🥈', '🥉'];
    const lines = top.map((u, i) => `${medals[i] || `\`#${i + 1}\``} <@${u.userId}> — **Lv.${u.chatLevel}** (\`${u.chatXp.toLocaleString()} XP\` • ${u.messages} msgs)`);
    message.reply({ embeds: [KikiEmbed.purple(`🏆 Chat Activity Top 10 • ${message.guild.name}`, lines.join('\n'))] });
  }
};
