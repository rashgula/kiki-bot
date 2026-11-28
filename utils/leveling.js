// KIKI Bot - Voice & Chat Leveling Engine (Cloud-Synced, Atomic & Anti-Downgrade)
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const KIKI = require('./kiki.js');
const KikiEmbed = require('./embed.js');
const KikiEmojis = require('./emojis.js');
const CloudSync = require('./cloudSync.js');
const config = require('../config.js');

const LEVELS_FILE = CloudSync.getDataFile('levels.json');
const BACKUP_FILE = CloudSync.getDataFile('levels_backup.json');

// In-memory cache for fast lookups and atomic writes
let levelsCache = null;
let saveTimeout = null;

function calcXpForLevel(level) {
  if (!level || level <= 0) return 0;
  return Math.floor(75 * level * (1 + level * 0.25));
}

function calcLevelFromXp(xp) {
  if (!xp || xp <= 0) return 0;
  let lvl = 0;
  while (xp >= calcXpForLevel(lvl + 1)) {
    lvl++;
    if (lvl >= 500) break;
  }
  return lvl;
}

function normalizeUserRecord(u) {
  if (!u || typeof u !== 'object') return u;
  u.xp = Math.max(0, Number(u.xp) || 0);
  u.voiceTime = Math.max(0, Number(u.voiceTime) || 0);
  u.chatXp = Math.max(0, Number(u.chatXp) || 0);
  u.messages = Math.max(0, Number(u.messages) || 0);

  const compVc = calcLevelFromXp(u.xp);
  u.level = Math.max(Number(u.level) || 0, Number(u.highestLevel) || 0, compVc);
  u.highestLevel = Math.max(Number(u.highestLevel) || 0, u.level);
  // Guarantee XP is never below the threshold of the user's current level
  const minVcXp = calcXpForLevel(u.level);
  if (u.xp < minVcXp) u.xp = minVcXp;

  const compChat = calcLevelFromXp(u.chatXp);
  u.chatLevel = Math.max(Number(u.chatLevel) || 0, Number(u.highestChatLevel) || 0, compChat);
  u.highestChatLevel = Math.max(Number(u.highestChatLevel) || 0, u.chatLevel);
  const minChatXp = calcXpForLevel(u.chatLevel);
  if (u.chatXp < minChatXp) u.chatXp = minChatXp;

  if (u.lastChatXp === undefined) u.lastChatXp = 0;
  return u;
}

// Helper to merge two data objects keeping the strictly HIGHEST stats (or newer manual override)
function mergeHighestStats(primary, fallback) {
  if (!fallback || typeof fallback !== 'object') return primary || {};
  if (!primary || typeof primary !== 'object') primary = {};

  for (const guildId in fallback) {
    if (!primary[guildId] || typeof primary[guildId] !== 'object') {
      primary[guildId] = {};
    }
    const fGuild = fallback[guildId];
    if (!fGuild || typeof fGuild !== 'object') continue;

    for (const userId in fGuild) {
      const fUser = fGuild[userId];
      if (!fUser || typeof fUser !== 'object') continue;

      if (!primary[guildId][userId]) {
        primary[guildId][userId] = normalizeUserRecord({ ...fUser });
        continue;
      }

      const pUser = normalizeUserRecord(primary[guildId][userId]);
      const rUser = normalizeUserRecord({ ...fUser });

      const pManual = pUser.manualUpdatedAt || 0;
      const rManual = rUser.manualUpdatedAt || 0;

      if (rManual > pManual && rManual > 0) {
        // Respect newer explicit admin setlevel / setxp
        pUser.xp = rUser.xp;
        pUser.level = rUser.level;
        pUser.highestLevel = rUser.highestLevel;
        pUser.manualUpdatedAt = rManual;
        pUser.voiceTime = Math.max(pUser.voiceTime || 0, rUser.voiceTime || 0);
      } else if (pManual > rManual && pManual > 0) {
        pUser.voiceTime = Math.max(pUser.voiceTime || 0, rUser.voiceTime || 0);
      } else {
        pUser.xp = Math.max(pUser.xp || 0, rUser.xp || 0);
        pUser.voiceTime = Math.max(pUser.voiceTime || 0, rUser.voiceTime || 0);
        pUser.highestLevel = Math.max(pUser.highestLevel || 0, rUser.highestLevel || 0, pUser.level || 0, rUser.level || 0);
        pUser.level = Math.max(pUser.level || 0, pUser.highestLevel);
      }

      pUser.chatXp = Math.max(pUser.chatXp || 0, rUser.chatXp || 0);
      pUser.messages = Math.max(pUser.messages || 0, rUser.messages || 0);
      pUser.highestChatLevel = Math.max(pUser.highestChatLevel || 0, rUser.highestChatLevel || 0, pUser.chatLevel || 0, rUser.chatLevel || 0);
      pUser.chatLevel = Math.max(pUser.chatLevel || 0, pUser.highestChatLevel);
      pUser.lastChatXp = Math.max(pUser.lastChatXp || 0, rUser.lastChatXp || 0);

      normalizeUserRecord(pUser);
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

  if (fs.existsSync(BACKUP_FILE)) {
    try {
      const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
      loadedData = mergeHighestStats(loadedData, backupData);
    } catch (err) {
      console.error('[LEVELING ERROR] Failed to parse backup file:', err.message);
    }
  }

  // Normalize all records on load
  for (const gid of Object.keys(loadedData)) {
    if (!loadedData[gid] || typeof loadedData[gid] !== 'object') {
      loadedData[gid] = {};
      continue;
    }
    for (const uid of Object.keys(loadedData[gid])) {
      normalizeUserRecord(loadedData[gid][uid]);
    }
  }

  levelsCache = loadedData;
  return levelsCache;
}

function saveDataImmediate(data) {
  try {
    CloudSync.writeJsonAtomic(LEVELS_FILE, data);
    CloudSync.writeJsonAtomic(BACKUP_FILE, data);
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
  _tickerStarted: false,
  _client: null,

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

  // Merge cloud snapshot fetched from Discord
  mergeCloudSnapshot(remoteData) {
    const data = loadData();
    const merged = mergeHighestStats(data, remoteData);
    levelsCache = merged;
    saveDataImmediate(levelsCache);
    return levelsCache;
  },

  // Required XP for given level
  getXpForLevel(level) {
    return calcXpForLevel(level);
  },

  // Calculate level from total XP
  getLevelFromXp(xp) {
    return calcLevelFromXp(xp);
  },

  // Get user profile in a guild
  getUser(guildId, userId) {
    const data = loadData();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) {
      data[guildId][userId] = {
        xp: 0,
        level: 0,
        highestLevel: 0,
        voiceTime: 0,
        chatXp: 0,
        chatLevel: 0,
        highestChatLevel: 0,
        messages: 0,
        lastVoiceTick: Date.now(),
        lastChatXp: 0
      };
    }
    return normalizeUserRecord(data[guildId][userId]);
  },

  // Format seconds to human readable
  formatVoiceTime(totalSeconds) {
    if (!totalSeconds || totalSeconds < 60) return `${Math.max(0, Math.floor(totalSeconds || 0))}s`;
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

  // Sync role rewards for a member's current level
  async syncMemberLevelRoles(guild, member, level, removeHigherOnDowngrade = false) {
    try {
      const cfg = KIKI.loadConfig();
      const levelRoles = KIKI.getGuildLevelRoles(guild);
      const stackRoles = KIKI.getGuildConfig(guild.id, 'level_stack_roles', cfg.level_stack_roles !== false);

      let newlyAwardedRole = null;
      const rolesToRemove = [];

      const configuredLevels = Object.keys(levelRoles)
        .map(Number)
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

      const highestReachedTier = configuredLevels.filter(l => l <= level).pop();

      for (const lvl of configuredLevels) {
        const roleId = levelRoles[String(lvl)];
        if (!roleId) continue;
        const role = guild.roles.cache.get(roleId);
        if (!role) continue;

        if (lvl <= level) {
          if (lvl === highestReachedTier) {
            newlyAwardedRole = role;
          }

          if (stackRoles) {
            if (!member.roles.cache.has(role.id)) {
              await member.roles.add(role, `[KIKI Voice Level] Unlocked Level ${lvl}`).catch((err) => {
                console.error(`[LEVEL ROLE ADD ERROR] Could not add ${role.name}:`, err.message);
              });
              console.log(chalk.bold.yellow(`  👑 [LEVEL ROLE AWARDED] Added @${role.name} to ${member.user.tag}`));
            }
          } else {
            if (lvl === highestReachedTier) {
              if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role, `[KIKI Voice Level] Unlocked Level ${lvl}`).catch((err) => {
                  console.error(`[LEVEL ROLE ADD ERROR] Could not add ${role.name}:`, err.message);
                });
                console.log(chalk.bold.yellow(`  👑 [LEVEL ROLE AWARDED] Added @${role.name} to ${member.user.tag}`));
              }
            } else if (member.roles.cache.has(role.id)) {
              rolesToRemove.push(role);
            }
          }
        } else if (removeHigherOnDowngrade && member.roles.cache.has(role.id)) {
          rolesToRemove.push(role);
        }
      }

      if (rolesToRemove.length > 0) {
        for (const r of rolesToRemove) {
          await member.roles.remove(r).catch(() => {});
        }
      }

      return newlyAwardedRole;
    } catch (err) {
      console.error('[SYNC LEVEL ROLES ERROR]', err.message);
      return null;
    }
  },

  // Award Voice XP (per-minute tick or positive admin boost)
  async addVoiceXp(guild, member, xpAmount = 10, seconds = 60) {
    if (!guild || !member || member.user?.bot) return null;
    const gain = Math.max(0, Math.floor(Number(xpAmount) || 0));
    const secGain = Math.max(0, Math.floor(Number(seconds) || 0));

    const user = this.getUser(guild.id, member.id);
    const oldLevel = Math.max(user.level || 0, user.highestLevel || 0, calcLevelFromXp(user.xp));

    user.xp = (user.xp || 0) + gain;
    user.voiceTime = (user.voiceTime || 0) + secGain;
    user.lastVoiceTick = Date.now();

    const computedLevel = calcLevelFromXp(user.xp);
    const newLevel = Math.max(computedLevel, oldLevel);
    user.level = newLevel;
    user.highestLevel = Math.max(user.highestLevel || 0, newLevel);

    scheduleSave();

    if (newLevel > oldLevel) {
      saveDataImmediate(levelsCache);
      if (this._client) CloudSync.schedulePush(this._client, 10000);
      await this.handleLevelUp(guild, member, oldLevel, newLevel);
      return { oldLevel, newLevel, leveledUp: true, user };
    }

    if (this._client) CloudSync.schedulePush(this._client, 180000);
    return { oldLevel, newLevel, leveledUp: false, user };
  },

  // Set user Level directly (Owner / Admin command)
  async setUserLevel(guild, member, targetLevel) {
    if (!guild || !member) return null;
    const cleanTarget = Math.max(0, Math.min(500, Math.floor(Number(targetLevel) || 0)));
    const targetXp = calcXpForLevel(cleanTarget);

    const user = this.getUser(guild.id, member.id);
    const oldLevel = user.level || 0;

    user.xp = targetXp;
    user.level = cleanTarget;
    user.highestLevel = cleanTarget;
    user.manualUpdatedAt = Date.now();

    saveDataImmediate(levelsCache);
    if (this._client) CloudSync.schedulePush(this._client, 5000);

    if (cleanTarget > oldLevel) {
      await this.handleLevelUp(guild, member, oldLevel, cleanTarget);
    } else {
      await this.syncMemberLevelRoles(guild, member, cleanTarget, true);
    }
    return user;
  },

  // Set user XP directly (Owner / Admin command)
  async setUserXp(guild, member, targetXp) {
    if (!guild || !member) return null;
    const cleanXp = Math.max(0, Math.floor(Number(targetXp) || 0));

    const user = this.getUser(guild.id, member.id);
    const oldLevel = user.level || 0;
    const newLevel = calcLevelFromXp(cleanXp);

    user.xp = cleanXp;
    user.level = newLevel;
    user.highestLevel = newLevel;
    user.manualUpdatedAt = Date.now();

    saveDataImmediate(levelsCache);
    if (this._client) CloudSync.schedulePush(this._client, 5000);

    if (newLevel > oldLevel) {
      await this.handleLevelUp(guild, member, oldLevel, newLevel);
    } else {
      await this.syncMemberLevelRoles(guild, member, newLevel, true);
    }
    return user;
  },

  // Handle Level Up: Award roles and announce
  async handleLevelUp(guild, member, oldLevel, newLevel) {
    try {
      const newlyAwardedRole = await this.syncMemberLevelRoles(guild, member, newLevel, false);

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

        // Only mention member on every 10 levels increase (e.g. Level 10, 20, 30...)
        const isMilestone = (newLevel % 10 === 0);
        const embed = KikiEmbed.build({
          title: `${KikiEmojis.SPARKLE} LEVEL UP! Voice Master ${isMilestone ? '🔥 (Milestone Tier)' : ''}`,
          description: `${KikiEmojis.goodbyeBanner()}\n\nCongratulations ${member.user.toString()}! Aap **Level ${newLevel}** par pahunch gaye hain! ${KikiEmojis.HEART}`,
          color: config.COLORS.PRIMARY || 0x9B59B6,
          thumbnail: member.user.displayAvatarURL({ dynamic: true }),
          fields
        });

        const msgPayload = isMilestone
          ? { content: `${member.user.toString()}`, embeds: [embed] }
          : { embeds: [embed] };
        await channel.send(msgPayload).catch(() => {});
      }
    } catch (err) {
      console.error('[LEVEL UP HANDLER ERROR]', err.message);
    }
  },

  // Voice Ticker: Scans every 60 seconds
  initVoiceTicker(client) {
    this._client = client;
    if (this._tickerStarted) return;
    this._tickerStarted = true;

    console.log('[LEVELING] Initializing Voice XP Tracker (Active scan interval: 60s)...');
    let isScanning = false;

    const scanVoice = async () => {
      if (isScanning) return;
      isScanning = true;
      try {
        for (const [, guild] of client.guilds.cache) {
          if (!guild.available) continue;

          const deafAfkId = KIKI.getGuildConfig(guild.id, 'deaf_afk_channel_id', null);
          const seenMemberIds = new Set();

          // Collect active non-deafened voice states from cache
          const activeStates = [];
          for (const state of guild.voiceStates.cache.values()) {
            if (!state.channelId) continue;
            if (seenMemberIds.has(state.id)) continue;
            seenMemberIds.add(state.id);
            activeStates.push({ memberId: state.id, channelId: state.channelId, state });
          }

          // Fallback: also inspect voice/stage channel member caches in case voiceStates missed anyone
          for (const [, vc] of guild.channels.cache) {
            if ((vc.type === 2 || vc.type === 13) && vc.members?.size > 0) {
              for (const [mId, mem] of vc.members) {
                if (seenMemberIds.has(mId)) continue;
                seenMemberIds.add(mId);
                activeStates.push({ memberId: mId, channelId: vc.id, state: mem.voice, memberObj: mem });
              }
            }
          }

          for (const item of activeStates) {
            const { channelId, state, memberObj } = item;
            if (!channelId) continue;
            if (channelId === guild.afkChannelId || (deafAfkId && channelId === deafAfkId)) continue;
            if (state && (state.deaf || state.selfDeaf || state.suppress)) continue;

            const member = memberObj || state?.member || guild.members.cache.get(item.memberId) ||
              await guild.members.fetch(item.memberId).catch(() => null);
            if (!member || member.user?.bot) continue;

            const vc = guild.channels.cache.get(channelId);
            const vcName = vc?.name || 'Voice Channel';

            // Award reduced & balanced Voice XP (8-12 XP per minute instead of 18-23)
            const xpGain = Math.floor(Math.random() * 5) + 8;
            const res = await this.addVoiceXp(guild, member, xpGain, 60);

            if (res) {
              console.log(chalk.cyan(`  🎙️ [VOICE XP] +${xpGain} XP -> ${member.user.tag} in #${vcName} (Total: ${res.user.xp} XP | Level: ${res.user.level})`));
            }
          }
        }
      } catch (err) {
        console.error('[VOICE TICKER ERROR]', err.message);
      } finally {
        isScanning = false;
      }
    };

    // Wait 12s after boot so CloudSync restore finishes first, then run every 60s
    setTimeout(scanVoice, 12000);
    setInterval(scanVoice, 60000);
  },

  // Get Top Users Leaderboard
  getLeaderboard(guildId, limit = 10) {
    const data = loadData();
    const guildData = data[guildId] || {};
    const users = Object.entries(guildData).map(([id, stats]) => {
      const norm = normalizeUserRecord(stats);
      return {
        userId: id,
        xp: norm.xp || 0,
        level: norm.level || calcLevelFromXp(norm.xp || 0),
        voiceTime: norm.voiceTime || 0
      };
    });

    users.sort((a, b) => (b.level - a.level) || (b.xp - a.xp));
    return users.slice(0, limit);
  },

  // ── Chat XP & Leveling (NO ROLES AWARDED) ─────────────────────────
  async addChatXp(guild, member, channel) {
    if (!guild || !member || member.user?.bot) return null;
    const isEnabled = KIKI.getGuildConfig(guild.id, 'chat_xp_enabled', true);
    if (isEnabled === false) return null;

    const user = this.getUser(guild.id, member.id);
    user.messages = (user.messages || 0) + 1;

    // Anti-spam cooldown: 45 seconds between XP gain
    const now = Date.now();
    if (user.lastChatXp && now - user.lastChatXp < 45000) {
      scheduleSave();
      return null;
    }

    user.lastChatXp = now;
    const xpGain = Math.floor(Math.random() * 11) + 15; // 15 - 25 XP
    const oldLevel = Math.max(user.chatLevel || 0, user.highestChatLevel || 0, calcLevelFromXp(user.chatXp || 0));
    user.chatXp = (user.chatXp || 0) + xpGain;
    const computedChatLevel = calcLevelFromXp(user.chatXp);
    const newLevel = Math.max(computedChatLevel, oldLevel);
    user.chatLevel = newLevel;
    user.highestChatLevel = Math.max(user.highestChatLevel || 0, newLevel);

    scheduleSave();

    if (newLevel > oldLevel) {
      saveDataImmediate(levelsCache);
      if (this._client) CloudSync.schedulePush(this._client, 15000);
      await this.handleChatLevelUp(guild, member, channel, oldLevel, newLevel);
      return { oldLevel, newLevel, leveledUp: true, user };
    }

    return { oldLevel, newLevel, leveledUp: false, user };
  },

  // Handle Chat Level Up: Announce level up (NO ROLES GIVEN)
  async handleChatLevelUp(guild, member, channel, oldLevel, newLevel) {
    try {
      const alertsEnabled = KIKI.getGuildConfig(guild.id, 'chat_level_alerts', true);
      if (alertsEnabled === false) return;

      const targetChannel = KIKI.getGuildChannel(guild, 'chat_level_channel_id');
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
    const users = Object.entries(guildData).map(([id, stats]) => {
      const norm = normalizeUserRecord(stats);
      return {
        userId: id,
        chatXp: norm.chatXp || 0,
        chatLevel: norm.chatLevel || calcLevelFromXp(norm.chatXp || 0),
        messages: norm.messages || 0
      };
    });

    users.sort((a, b) => (b.chatLevel - a.chatLevel) || (b.chatXp - a.chatXp));
    return users.slice(0, limit);
  }
};

module.exports = Leveling;
