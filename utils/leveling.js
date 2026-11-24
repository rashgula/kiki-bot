// KIKI Bot - Voice & Chat Leveling Engine
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const KIKI = require('./kiki.js');
const KikiEmbed = require('./embed.js');
const KikiEmojis = require('./emojis.js');
const config = require('../config.js');

const LEVELS_FILE = path.join(__dirname, '../data/levels.json');
const BACKUP_FILE = path.join(__dirname, '../data/levels_backup.json');

// In-memory cache for fast lookups and atomic writes
let levelsCache = null;
let saveTimeout = null;

// Helper to merge two data objects keeping the strictly HIGHEST stats (prevents regressions)
function mergeHighestStats(primary, fallback) {
  if (!fallback) return primary;
  for (const guildId in fallback) {
    if (!primary[guildId]) {
      primary[guildId] = fallback[guildId];
      continue;
    }
    for (const userId in fallback[guildId]) {
      const fUser = fallback[guildId][userId];
      if (!primary[guildId][userId]) {
        primary[guildId][userId] = fUser;
        continue;
      }
      const pUser = primary[guildId][userId];
      // Keep strictly the highest stats to prevent any downgrade or regression!
      pUser.xp = Math.max(pUser.xp || 0, fUser.xp || 0);
      pUser.voiceTime = Math.max(pUser.voiceTime || 0, fUser.voiceTime || 0);
      pUser.chatXp = Math.max(pUser.chatXp || 0, fUser.chatXp || 0);
      pUser.messages = Math.max(pUser.messages || 0, fUser.messages || 0);
      pUser.highestLevel = Math.max(pUser.highestLevel || 0, fUser.highestLevel || 0, pUser.level || 0, fUser.level || 0);
      pUser.level = Math.max(pUser.level || 0, pUser.highestLevel);
    }
  }
  return primary;
}

function loadData() {
  if (levelsCache) return levelsCache;

  let loadedData = {};
  if (fs.existsSync(LEVELS_FILE)) {
    try {
      loadedData = JSON.parse(fs.readFileSync(LEVELS_FILE, 'utf-8'));
    } catch (err) {
      console.error('[LEVELING ERROR] Failed to parse levels.json:', err.message);
    }
  }

  // Check backup file to restore any higher stats if levels.json was reverted
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
      loadedData = mergeHighestStats(loadedData, backupData);
    } catch (err) {
      console.error('[LEVELING ERROR] Failed to parse backup file:', err.message);
    }
  }

  levelsCache = loadedData;
  return levelsCache;
}

function saveDataImmediate(data) {
  try {
    fs.writeFileSync(LEVELS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    // Save to persistent backup as well
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[LEVELING ERROR] Failed to save levels.json:', err.message);
  }
}

function scheduleSave() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    if (levelsCache) saveDataImmediate(levelsCache);
  }, 5000);
}

const Leveling = {
  // Save immediately to disk (for shutdown and restarts)
  saveNow() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    if (levelsCache) {
      saveDataImmediate(levelsCache);
    }
  },

  // Required XP for given level
  getXpForLevel(level) {
    if (level <= 0) return 0;
    return Math.floor(75 * level * (1 + level * 0.25));
  },

  // Calculate level from total XP
  getLevelFromXp(xp) {
    if (!xp || xp <= 0) return 0;
    let lvl = 0;
    while (xp >= this.getXpForLevel(lvl + 1)) {
      lvl++;
      if (lvl >= 500) break; // sanity ceiling
    }
    return lvl;
  },

  // Get user profile in a guild
  getUser(guildId, userId) {
    const data = loadData();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) {
      data[guildId][userId] = {
        xp: 0,
        level: 0,
        voiceTime: 0, // total seconds in VC
        chatXp: 0,
        chatLevel: 0,
        messages: 0,
        lastVoiceTick: Date.now(),
        lastChatXp: 0
      };
    }
    const u = data[guildId][userId];
    if (u.chatXp === undefined) u.chatXp = 0;
    if (u.chatLevel === undefined) u.chatLevel = this.getLevelFromXp(u.chatXp);
    if (u.messages === undefined) u.messages = 0;
    return u;
  },

  // Format seconds to human readable
  formatVoiceTime(totalSeconds) {
    if (!totalSeconds || totalSeconds < 60) return `${totalSeconds || 0}s`;
    const s = Math.floor(totalSeconds % 60);
    const m = Math.floor((totalSeconds / 60) % 60);
    const h = Math.floor((totalSeconds / 3600) % 24);
    const d = Math.floor(totalSeconds / 86400);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (parts.length === 0 || (d === 0 && h === 0)) parts.push(`${s}s`);
    return parts.join(' ');
  },

  // Award Voice XP (per-minute tick)
  async addVoiceXp(guild, member, xpAmount = 20, seconds = 60) {
    if (!guild || !member || member.user.bot) return null;
    const guildId = guild.id;
    const userId = member.id;

    const data = loadData();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) {
      data[guildId][userId] = {
        xp: 0,
        level: 0,
        voiceTime: 0,
        messages: 0
      };
    }

    const user = data[guildId][userId];
    const oldLevel = user.highestLevel || user.level || this.getLevelFromXp(user.xp);
    user.xp = (user.xp || 0) + xpAmount;
    user.voiceTime = (user.voiceTime || 0) + seconds;
    const computedLevel = this.getLevelFromXp(user.xp);
    const newLevel = Math.max(computedLevel, oldLevel);
    user.level = newLevel;
    user.highestLevel = Math.max(user.highestLevel || 0, newLevel);

    scheduleSave();

    if (computedLevel > oldLevel) {
      saveDataImmediate(data); // Immediate disk persistence on level up
      await this.handleLevelUp(guild, member, oldLevel, computedLevel);
      return { oldLevel, newLevel: computedLevel, leveledUp: true, user };
    }

    return { oldLevel, newLevel, leveledUp: false, user };
  },

  // Set user Level directly (Owner / Admin command)
  async setUserLevel(guild, member, targetLevel) {
    if (!guild || !member) return null;
    const targetXp = this.getXpForLevel(targetLevel);
    const data = loadData();
    if (!data[guild.id]) data[guild.id] = {};
    if (!data[guild.id][member.id]) this.getUser(guild.id, member.id);
    const user = data[guild.id][member.id];
    const oldLevel = user.level || 0;
    user.xp = targetXp;
    user.level = targetLevel;
    user.highestLevel = Math.max(user.highestLevel || 0, targetLevel);
    saveDataImmediate(data);
    await this.handleLevelUp(guild, member, oldLevel, targetLevel);
    return user;
  },

  // Set user XP directly (Owner / Admin command)
  async setUserXp(guild, member, targetXp) {
    if (!guild || !member) return null;
    const data = loadData();
    if (!data[guild.id]) data[guild.id] = {};
    if (!data[guild.id][member.id]) this.getUser(guild.id, member.id);
    const user = data[guild.id][member.id];
    const oldLevel = user.level || 0;
    user.xp = targetXp;
    const newLevel = this.getLevelFromXp(targetXp);
    user.level = newLevel;
    user.highestLevel = Math.max(user.highestLevel || 0, newLevel);
    saveDataImmediate(data);
    if (newLevel > oldLevel) {
      await this.handleLevelUp(guild, member, oldLevel, newLevel);
    }
    return user;
  },

  // Handle Level Up: Award roles and announce
  async handleLevelUp(guild, member, oldLevel, newLevel) {
    try {
      const cfg = KIKI.loadConfig();
      const levelRoles = KIKI.getGuildLevelRoles(guild);
      const stackRoles = cfg.level_stack_roles !== false; // default true

      let newlyAwardedRole = null;
      const rolesToRemove = [];

      // Check all configured levels up to newLevel
      const configuredLevels = Object.keys(levelRoles)
        .map(Number)
        .sort((a, b) => a - b);

      const highestReachedTier = configuredLevels.filter(l => l <= newLevel).pop();

      for (const lvl of configuredLevels) {
        const roleId = levelRoles[String(lvl)];
        if (!roleId) continue;
        const role = guild.roles.cache.get(roleId);
        if (!role) continue;

        if (lvl <= newLevel) {
          if (lvl === highestReachedTier) {
            newlyAwardedRole = role;
          }

          if (stackRoles) {
            // Keep all unlocked roles
            if (!member.roles.cache.has(role.id)) {
              await member.roles.add(role, `[KIKI Voice Level] Unlocked Level ${lvl}`).catch((err) => {
                console.error(`[LEVEL ROLE ADD ERROR] Could not add ${role.name}:`, err.message);
              });
              console.log(chalk.bold.yellow(`  👑 [LEVEL ROLE AWARDED] Added @${role.name} to ${member.user.tag}`));
            }
          } else {
            // Only keep highest unlocked role
            if (lvl === highestReachedTier) {
              if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role, `[KIKI Voice Level] Unlocked Level ${lvl}`).catch((err) => {
                  console.error(`[LEVEL ROLE ADD ERROR] Could not add ${role.name}:`, err.message);
                });
                console.log(chalk.bold.yellow(`  👑 [LEVEL ROLE AWARDED] Added @${role.name} to ${member.user.tag}`));
              }
            } else {
              if (member.roles.cache.has(role.id)) {
                rolesToRemove.push(role);
              }
            }
          }
        }
      }

      // If stacking is off, remove lower tier roles
      if (!stackRoles && rolesToRemove.length > 0) {
        for (const r of rolesToRemove) {
          await member.roles.remove(r).catch(() => {});
        }
      }

      // ── Level Up Announcement ──
      const channel = KIKI.getGuildChannel(guild, 'level_channel_id') ||
        KIKI.getGuildChannel(guild, 'voice_log_channel_id') ||
        KIKI.getGuildChannel(guild, 'security_log_channel_id');

      if (channel && channel.isTextBased()) {
          const userData = this.getUser(guild.id, member.id);
          const fields = [
            { name: `${KikiEmojis.SPARKLE} New Level`, value: `\`Level ${newLevel}\``, inline: true },
            { name: `${KikiEmojis.COIN} Total XP`, value: `\`${userData.xp.toLocaleString()} XP\``, inline: true },
            { name: `🎙️ Voice Time`, value: `\`${this.formatVoiceTime(userData.voiceTime)}\``, inline: true }
          ];

          if (newlyAwardedRole) {
            fields.push({
              name: `${KikiEmojis.get('personal')} Role Unlocked`,
              value: `${newlyAwardedRole.toString()} (\`${newlyAwardedRole.name}\`)`,
              inline: false
            });
          }

          const embed = KikiEmbed.build({
            title: `${KikiEmojis.SPARKLE} LEVEL UP! Voice Master ${KikiEmojis.FIRE}`,
            description: `${KikiEmojis.goodbyeBanner()}\n\nCongratulations ${member.user.toString()}! Aap **Level ${newLevel}** par pahunch gaye hain! ${KikiEmojis.HEART}`,
            color: config.COLORS.PRIMARY || 0x9B59B6,
            thumbnail: member.user.displayAvatarURL({ dynamic: true }),
            fields
          });

          await channel.send({ content: `${member.user.toString()}`, embeds: [embed] }).catch(() => {});
        }
    } catch (err) {
      console.error('[LEVEL UP HANDLER ERROR]', err.message);
    }
  },

  // Voice Ticker: Scans every 60 seconds (and runs initial scan after 5s)
  initVoiceTicker(client) {
    if (this._tickerStarted) return;
    this._tickerStarted = true;

    console.log('[LEVELING] Initializing Voice XP Tracker (Active scan interval: 60s)...');

    const scanVoice = async () => {
      try {
        for (const [, guild] of client.guilds.cache) {
          if (!guild.available) continue;

          // If voiceStates cache is empty, fetch to hydrate active sessions
          if (guild.voiceStates.cache.size === 0) {
            await guild.fetch().catch(() => {});
          }

          for (const state of guild.voiceStates.cache.values()) {
            // Must be in a voice channel and not in AFK channel
            if (!state.channelId || state.channelId === guild.afkChannelId) continue;

            // Don't award XP if deafened (self or server deaf) to prevent AFK farming
            if (state.deaf || state.selfDeaf) continue;

            // Get or fetch member
            const member = state.member || await guild.members.fetch(state.id).catch(() => null);
            if (!member || member.user.bot) continue;

            const vc = guild.channels.cache.get(state.channelId);
            const vcName = vc?.name || 'Voice Channel';

            // Award 18-23 XP per minute (standard Voice XP)
            const xpGain = Math.floor(Math.random() * 6) + 18;
            const res = await this.addVoiceXp(guild, member, xpGain, 60);

            if (res) {
              console.log(chalk.cyan(`  🎙️ [VOICE XP] +${xpGain} XP -> ${member.user.tag} in #${vcName} (Total: ${res.user.xp} XP | Level: ${res.user.level})`));
            }
          }
        }
      } catch (err) {
        console.error('[VOICE TICKER ERROR]', err.message);
      }
    };

    // Run first scan shortly after boot (5s) so current VC members get tracked immediately
    setTimeout(scanVoice, 5000);

    // Run recurring scan every 60 seconds
    setInterval(scanVoice, 60000);
  },

  // Get Top Users Leaderboard
  getLeaderboard(guildId, limit = 10) {
    const data = loadData();
    const guildData = data[guildId] || {};
    const users = Object.entries(guildData).map(([id, stats]) => ({
      userId: id,
      xp: stats.xp || 0,
      level: stats.level || this.getLevelFromXp(stats.xp || 0),
      voiceTime: stats.voiceTime || 0
    }));

    users.sort((a, b) => b.xp - a.xp);
    return users.slice(0, limit);
  },

  // ── Chat XP & Leveling (NO ROLES AWARDED) ─────────────────────────
  async addChatXp(guild, member, channel) {
    if (!guild || !member || member.user?.bot) return null;
    const cfg = KIKI.loadConfig();
    if (cfg.chat_xp_enabled === false) return null;

    const guildId = guild.id;
    const userId = member.id;
    const user = this.getUser(guildId, userId);

    user.messages = (user.messages || 0) + 1;

    // Anti-spam cooldown: 45 seconds between XP gain
    const now = Date.now();
    if (user.lastChatXp && now - user.lastChatXp < 45000) {
      scheduleSave();
      return null;
    }

    user.lastChatXp = now;
    const xpGain = Math.floor(Math.random() * 11) + 15; // 15 - 25 XP
    const oldLevel = user.chatLevel || this.getLevelFromXp(user.chatXp || 0);
    user.chatXp = (user.chatXp || 0) + xpGain;
    const newLevel = this.getLevelFromXp(user.chatXp);
    user.chatLevel = newLevel;

    scheduleSave();

    if (newLevel > oldLevel) {
      await this.handleChatLevelUp(guild, member, channel, oldLevel, newLevel);
      return { oldLevel, newLevel, leveledUp: true, user };
    }

    return { oldLevel, newLevel, leveledUp: false, user };
  },

  // Handle Chat Level Up: Announce level up (NO ROLES GIVEN)
  async handleChatLevelUp(guild, member, channel, oldLevel, newLevel) {
    try {
      const cfg = KIKI.loadConfig();
      if (cfg.chat_level_alerts === false) return; // Silent mode

      const announceChannelId = cfg.chat_level_channel_id;
      if (!announceChannelId) return;

      const targetChannel = guild.channels.cache.get(announceChannelId) ||
        await guild.channels.fetch(announceChannelId).catch(() => null);

      if (targetChannel && targetChannel.isTextBased()) {
        const userData = this.getUser(guild.id, member.id);
        const embed = KikiEmbed.build({
          title: `${KikiEmojis.SPARKLE} LEVEL UP! Chat Activity ${KikiEmojis.FIRE}`,
          description: `${KikiEmojis.goodbyeBanner()}\n\nCongratulations ${member.user.toString()}! Aapka **Chat Level ${newLevel}** ho gaya hai! ${KikiEmojis.HEART}\n\n> *Server me active rehne ke liye shukriya!*`,
          color: config.COLORS.TEAL || 0x1ABC9C,
          thumbnail: member.user.displayAvatarURL({ dynamic: true }),
          fields: [
            { name: `${KikiEmojis.SPARKLE} Chat Level`, value: `\`Level ${newLevel}\``, inline: true },
            { name: `✉️ Total Messages`, value: `\`${userData.messages.toLocaleString()} msgs\``, inline: true },
            { name: `${KikiEmojis.COIN} Chat XP`, value: `\`${userData.chatXp.toLocaleString()} XP\``, inline: true }
          ],
          footer: { text: `Apna chat level check karne ke liye: &chatrank` }
        });

        await targetChannel.send({ content: `${member.user.toString()}`, embeds: [embed] }).catch(() => {});
      }
    } catch (err) {
      console.error('[CHAT LEVEL UP ERROR]', err.message);
    }
  },

  // Get Top Chat Leaderboard
  getChatLeaderboard(guildId, limit = 10) {
    const data = loadData();
    const guildData = data[guildId] || {};
    const users = Object.entries(guildData).map(([id, stats]) => ({
      userId: id,
      chatXp: stats.chatXp || 0,
      chatLevel: stats.chatLevel || this.getLevelFromXp(stats.chatXp || 0),
      messages: stats.messages || 0
    }));

    users.sort((a, b) => b.chatXp - a.chatXp);
    return users.slice(0, limit);
  }
};

module.exports = Leveling;
