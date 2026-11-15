// KIKI Bot - Voice Rank & Level Card Command
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Leveling = require('../../utils/leveling.js');
const KIKI = require('../../utils/kiki.js');
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
    .setName('rank')
    .setDescription('📊 View your or another member\'s Voice Level & XP Rank')
    .addUserOption(o => o.setName('user').setDescription('Member to inspect').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guild = interaction.guild;
    const userData = Leveling.getUser(guild.id, targetUser.id);

    const currentLevel = userData.level || Leveling.getLevelFromXp(userData.xp);
    const currentXp = userData.xp || 0;
    const prevLvlXp = Leveling.getXpForLevel(currentLevel);
    const nextLvlXp = Leveling.getXpForLevel(currentLevel + 1);

    const xpInCurrentLevel = currentXp - prevLvlXp;
    const xpNeededForNext = nextLvlXp - prevLvlXp;
    const progressBar = createProgressBar(xpInCurrentLevel, xpNeededForNext);

    // Get Leaderboard Position
    const leaderboard = Leveling.getLeaderboard(guild.id, 100);
    const rankIndex = leaderboard.findIndex(u => u.userId === targetUser.id);
    const rankDisplay = rankIndex !== -1 ? `#${rankIndex + 1}` : 'Unranked';

    // Check currently unlocked role and next role unlock
    const cfg = KIKI.loadConfig();
    const levelRoles = cfg.level_roles || {};
    let unlockedRoleDisplay = '`None` *(Roles unlock at Level 5+)*';

    const descendingLevels = Object.keys(levelRoles).map(Number).sort((a, b) => b - a);
    for (const lvl of descendingLevels) {
      if (currentLevel >= lvl) {
        unlockedRoleDisplay = `<@&${levelRoles[String(lvl)]}>`;
        break;
      }
    }

    const ascendingLevels = Object.keys(levelRoles).map(Number).sort((a, b) => a - b);
    let nextRoleText = '';
    for (const lvl of ascendingLevels) {
      if (lvl > currentLevel) {
        const nextRoleId = levelRoles[String(lvl)];
        const targetXp = Leveling.getXpForLevel(lvl);
        const diff = Math.max(0, targetXp - currentXp);
        nextRoleText = `\n• 🎯 **Next Role:** <@&${nextRoleId}> at \`Level ${lvl}\` *(${diff.toLocaleString()} XP remaining)*`;
        break;
      }
    }

    const embed = KikiEmbed.build({
      title: `🎙️ Voice Rank • ${targetUser.username}`,
      description:
        `**Rank:** \`${rankDisplay}\` • **Level:** \`${currentLevel}\`\n\n` +
        `**Progress to Level ${currentLevel + 1}:**\n` +
        `${progressBar}\n` +
        `\`${xpInCurrentLevel.toLocaleString()} / ${xpNeededForNext.toLocaleString()} XP\` *(Total: ${currentXp.toLocaleString()} XP)*\n\n` +
        `• ⏱️ **Total Voice Time:** \`${Leveling.formatVoiceTime(userData.voiceTime)}\`\n` +
        `• 💬 **Chat Level:** \`Level ${userData.chatLevel || 0}\` *(\`&chatrank\`)*\n` +
        `• 👑 **Unlocked Role:** ${unlockedRoleDisplay}` +
        nextRoleText,
      color: config.COLORS.PRIMARY || 0x9B59B6,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      footer: { text: `Join voice channels to earn 18-23 XP per minute! • KIKI v${config.BOT_VERSION}` }
    });

    await interaction.reply({ embeds: [embed] });
  },

  name: 'rank',
  aliases: ['level', 'vcrank', 'vclevel', 'xp'],
  async run(message, args) {
    const targetUser = message.mentions.users.first() ||
      (args[0] ? message.guild.members.cache.get(args[0])?.user : null) ||
      message.author;

    const guild = message.guild;
    const userData = Leveling.getUser(guild.id, targetUser.id);

    const currentLevel = userData.level || Leveling.getLevelFromXp(userData.xp);
    const currentXp = userData.xp || 0;
    const prevLvlXp = Leveling.getXpForLevel(currentLevel);
    const nextLvlXp = Leveling.getXpForLevel(currentLevel + 1);

    const xpInCurrentLevel = currentXp - prevLvlXp;
    const xpNeededForNext = nextLvlXp - prevLvlXp;
    const progressBar = createProgressBar(xpInCurrentLevel, xpNeededForNext);

    // Get Leaderboard Position
    const leaderboard = Leveling.getLeaderboard(guild.id, 100);
    const rankIndex = leaderboard.findIndex(u => u.userId === targetUser.id);
    const rankDisplay = rankIndex !== -1 ? `#${rankIndex + 1}` : 'Unranked';

    // Check currently unlocked role and next role unlock
    const cfg = KIKI.loadConfig();
    const levelRoles = cfg.level_roles || {};
    let unlockedRoleDisplay = '`None` *(Roles unlock at Level 5+)*';

    const descendingLevels = Object.keys(levelRoles).map(Number).sort((a, b) => b - a);
    for (const lvl of descendingLevels) {
      if (currentLevel >= lvl) {
        unlockedRoleDisplay = `<@&${levelRoles[String(lvl)]}>`;
        break;
      }
    }

    const ascendingLevels = Object.keys(levelRoles).map(Number).sort((a, b) => a - b);
    let nextRoleText = '';
    for (const lvl of ascendingLevels) {
      if (lvl > currentLevel) {
        const nextRoleId = levelRoles[String(lvl)];
        const targetXp = Leveling.getXpForLevel(lvl);
        const diff = Math.max(0, targetXp - currentXp);
        nextRoleText = `\n• 🎯 **Next Role:** <@&${nextRoleId}> at \`Level ${lvl}\` *(${diff.toLocaleString()} XP remaining)*`;
        break;
      }
    }

    const embed = KikiEmbed.build({
      title: `🎙️ Voice Rank • ${targetUser.username}`,
      description:
        `**Rank:** \`${rankDisplay}\` • **Level:** \`${currentLevel}\`\n\n` +
        `**Progress to Level ${currentLevel + 1}:**\n` +
        `${progressBar}\n` +
        `\`${xpInCurrentLevel.toLocaleString()} / ${xpNeededForNext.toLocaleString()} XP\` *(Total: ${currentXp.toLocaleString()} XP)*\n\n` +
        `• ⏱️ **Total Voice Time:** \`${Leveling.formatVoiceTime(userData.voiceTime)}\`\n` +
        `• 💬 **Chat Level:** \`Level ${userData.chatLevel || 0}\` *(\`&chatrank\`)*\n` +
        `• 👑 **Unlocked Role:** ${unlockedRoleDisplay}` +
        nextRoleText,
      color: config.COLORS.PRIMARY || 0x9B59B6,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      footer: { text: `Join voice channels to earn 18-23 XP per minute! • KIKI v${config.BOT_VERSION}` }
    });

    message.reply({ embeds: [embed] });
  }
};
