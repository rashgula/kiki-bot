// KIKI Bot - Chat Level & Rank Card Command (NO ROLES)
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Leveling = require('../../utils/leveling.js');
const config = require('../../config.js');

function createProgressBar(current, target, length = 12) {
  if (target <= 0) return '`[████████████]` 100%';
  const percentage = Math.min(Math.max(current / target, 0), 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `\`[${bar}]\` ${Math.floor(percentage * 100)}%`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chatrank')
    .setDescription('💬 View your or another member\'s Chat Activity Level & Message Count')
    .addUserOption(o => o.setName('user').setDescription('Member to inspect').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guild = interaction.guild;
    const userData = Leveling.getUser(guild.id, targetUser.id);

    const currentLevel = userData.chatLevel ?? Leveling.getLevelFromXp(userData.chatXp || 0);
    const currentXp = Math.max(0, userData.chatXp || 0);
    const prevLvlXp = Leveling.getXpForLevel(currentLevel);
    const nextLvlXp = Leveling.getXpForLevel(currentLevel + 1);

    const xpInCurrentLevel = Math.max(0, currentXp - prevLvlXp);
    const xpNeededForNext = Math.max(1, nextLvlXp - prevLvlXp);
    const progressBar = createProgressBar(xpInCurrentLevel, xpNeededForNext);

    // Get Leaderboard Position
    const leaderboard = Leveling.getChatLeaderboard(guild.id, 100);
    const rankIndex = leaderboard.findIndex(u => u.userId === targetUser.id);
    const rankDisplay = rankIndex !== -1 ? `#${rankIndex + 1}` : 'Unranked';

    const embed = KikiEmbed.build({
      title: `💬 Chat Level • ${targetUser.username}`,
      description:
        `**Rank:** \`${rankDisplay}\` • **Chat Level:** \`${currentLevel}\`\n\n` +
        `**Progress to Level ${currentLevel + 1}:**\n` +
        `${progressBar}\n` +
        `\`${xpInCurrentLevel.toLocaleString()} / ${xpNeededForNext.toLocaleString()} XP\` *(Total: ${currentXp.toLocaleString()} XP)*\n\n` +
        `• ✉️ **Total Messages Sent:** \`${userData.messages.toLocaleString()} msgs\`\n` +
        `• 💬 **Chat XP Earned:** \`${currentXp.toLocaleString()} XP\``,
      color: config.COLORS.TEAL || 0x1ABC9C,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      footer: { text: `Chatting in text channels earns 15-25 XP! • KIKI v${config.BOT_VERSION}` }
    });

    await interaction.reply({ embeds: [embed] });
  },

  name: 'chatrank',
  aliases: ['chatlevel', 'crank', 'clevel', 'cxp'],
  async run(message, args) {
    let targetUser = message.mentions?.users?.first?.();
    if (!targetUser && args[0]) {
      const cleanId = args[0].replace(/[<@!>]/g, '');
      const m = message.guild.members.cache.get(cleanId)
        || message.guild.members.cache.find(mem => mem.user.username.toLowerCase() === args.join(' ').toLowerCase())
        || (/^\d{17,20}$/.test(cleanId) ? await message.guild.members.fetch(cleanId).catch(() => null) : null);
      if (m) targetUser = m.user;
    }
    if (!targetUser) targetUser = message.author;

    const guild = message.guild;
    const userData = Leveling.getUser(guild.id, targetUser.id);

    const currentLevel = userData.chatLevel ?? Leveling.getLevelFromXp(userData.chatXp || 0);
    const currentXp = Math.max(0, userData.chatXp || 0);
    const prevLvlXp = Leveling.getXpForLevel(currentLevel);
    const nextLvlXp = Leveling.getXpForLevel(currentLevel + 1);

    const xpInCurrentLevel = Math.max(0, currentXp - prevLvlXp);
    const xpNeededForNext = Math.max(1, nextLvlXp - prevLvlXp);
    const progressBar = createProgressBar(xpInCurrentLevel, xpNeededForNext);

    // Get Leaderboard Position
    const leaderboard = Leveling.getChatLeaderboard(guild.id, 100);
    const rankIndex = leaderboard.findIndex(u => u.userId === targetUser.id);
    const rankDisplay = rankIndex !== -1 ? `#${rankIndex + 1}` : 'Unranked';

    const embed = KikiEmbed.build({
      title: `💬 Chat Level • ${targetUser.username}`,
      description:
        `**Rank:** \`${rankDisplay}\` • **Chat Level:** \`${currentLevel}\`\n\n` +
        `**Progress to Level ${currentLevel + 1}:**\n` +
        `${progressBar}\n` +
        `\`${xpInCurrentLevel.toLocaleString()} / ${xpNeededForNext.toLocaleString()} XP\` *(Total: ${currentXp.toLocaleString()} XP)*\n\n` +
        `• ✉️ **Total Messages Sent:** \`${userData.messages.toLocaleString()} msgs\`\n` +
        `• 💬 **Chat XP Earned:** \`${currentXp.toLocaleString()} XP\``,
      color: config.COLORS.TEAL || 0x1ABC9C,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      footer: { text: `Chatting in text channels earns 15-25 XP! • KIKI v${config.BOT_VERSION}` }
    });

    message.reply({ embeds: [embed] });
  }
};
