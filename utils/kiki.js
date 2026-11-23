// KIKI Bot - Persona & Helper Utilities
const config = require('../config.js');
const fs = require('fs');
const path = require('path');

const KIKI = {
  name: 'KIKI',
  version: '2.2',
  tagline: config.BOT_TAGLINE,

  asciiArt: `
╔═══════════════════════════════════════════════╗
║  ██╗  ██╗██╗██╗  ██╗██╗                      ║
║  ██║ ██╔╝██║██║ ██╔╝██║  Gothic Utility Bot  ║
║  █████╔╝ ██║█████╔╝ ██║                      ║
║  ██╔═██╗ ██║██╔═██╗ ██║  v2.2 • JS Edition  ║
║  ██║  ██╗██║██║  ██╗██║  1,100+ Commands     ║
║  ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝                      ║
╚═══════════════════════════════════════════════╝
  `,

  quotes: [
    '🔮 "The dark arts serve those who dare to wield them..."',
    '🕷️ "Chaos is not destruction — it is transformation."',
    '💜 "In the void, I found my purpose. KIKI awakens."',
    '🌙 "Gothic utility at its finest — bow before KIKI."',
    '⚡ "Every server bows to the purple storm."'
  ],

  randomQuote() {
    return this.quotes[Math.floor(Math.random() * this.quotes.length)];
  },

  loadConfig() {
    const p = path.join(__dirname, '../data/config.json');
    if (!fs.existsSync(p)) return {};
    try {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch {
      return {};
    }
  },

  saveConfig(data) {
    const p = path.join(__dirname, '../data/config.json');
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
  },

  getGuildConfig(guildId, key, fallback = null) {
    if (!guildId) return fallback;
    const cfg = this.loadConfig();
    const gData = cfg.guilds?.[guildId];
    if (gData && gData[key] !== undefined && gData[key] !== null) {
      return gData[key];
    }
    if (cfg[key] !== undefined && cfg[key] !== null) {
      return cfg[key];
    }
    return fallback;
  },

  setGuildConfig(guildId, key, value) {
    if (!guildId) return;
    const cfg = this.loadConfig();
    if (!cfg.guilds) cfg.guilds = {};
    if (!cfg.guilds[guildId]) cfg.guilds[guildId] = {};
    cfg.guilds[guildId][key] = value;
    this.saveConfig(cfg);
  },

  getBotInviteUrl(clientId) {
    const id = clientId || '1339893994344775700';
    return `https://discord.com/oauth2/authorize?client_id=${id}&permissions=8&integration_type=0&scope=bot+applications.commands`;
  },

  isOwner(userId) {
    if (!userId) return false;
    const cfg = this.loadConfig();
    const owners = (cfg.owners || []).map(String);
    const envOwners = (config.OWNER_IDS || []).map(String);
    return owners.includes(String(userId)) || envOwners.includes(String(userId));
  },

  // Check if a user is the Server Owner or Bot Owner (STRICT OWNERSHIP CHECK)
  isServerOrBotOwner(guild, userId) {
    if (!userId) return false;
    const idStr = String(userId);
    if (guild && idStr === String(guild.ownerId)) return true;
    if (this.isOwner(idStr)) return true;
    // Extra trusted co-owner IDs allowed to use antinuke setup
    const cfg = this.loadConfig();
    const coOwners = (cfg.co_owners || []).map(String);
    if (coOwners.includes(idStr)) return true;
    return false;
  },

  // Master safety check for Anti-Nuke
  isSafe(guild, userId, client) {
    if (!userId) return false;
    const idStr = String(userId);
    if (client && idStr === String(client.user.id)) return true;
    if (guild && idStr === String(guild.ownerId)) return true;
    if (this.isOwner(idStr)) return true;
    const cfg = this.loadConfig();
    const wl = (cfg.whitelist || []).map(String);
    return wl.includes(idStr);
  },

  // Get guild-specific channel safely (multi-server aware)
  getGuildChannel(guild, key) {
    if (!guild) return null;
    const cfg = this.loadConfig();
    const gData = cfg.guilds?.[guild.id];
    let chId = gData?.[key];

    // Check guild-specific ID first
    if (chId && guild.channels.cache.has(chId)) {
      return guild.channels.cache.get(chId);
    }

    // Check top-level config ID if it belongs to this guild
    chId = cfg[key];
    if (chId && guild.channels.cache.has(chId)) {
      return guild.channels.cache.get(chId);
    }

    // Smart fallback by channel name matching in this guild
    const nameMap = {
      voice_log_channel_id: ['voice-logs', 'voice-log', 'voicelogs'],
      chat_log_channel_id: ['chat-logs', 'chat-log', 'chatlogs', 'msg-logs'],
      security_log_channel_id: ['security-logs', 'security-log', 'securitylogs', 'mod-logs'],
      log_channel_id: ['security-logs', 'security-log', 'logs'],
      welcome_channel_id: ['welcome', 'joins', 'join-logs'],
      leave_channel_id: ['leave-logs', 'leave', 'leaves'],
      level_channel_id: ['vc-levels', 'levels', 'level-logs', 'ranks'],
      chat_level_channel_id: ['chat-levels', 'chat-level']
    };

    const targetNames = nameMap[key] || [];
    const matched = guild.channels.cache.find(c => {
      if (c.type !== 0) return false;
      const lower = c.name.toLowerCase();
      return targetNames.some(t => lower.includes(t));
    });

    return matched || null;
  },

  // Get level roles for this guild
  getGuildLevelRoles(guild) {
    if (!guild) return {};
    const cfg = this.loadConfig();
    const gRoles = cfg.guilds?.[guild.id]?.level_roles;
    if (gRoles && Object.keys(gRoles).length > 0) return gRoles;

    const topRoles = cfg.level_roles || {};
    // Check if top-level roles exist in this guild
    const hasAny = Object.values(topRoles).some(id => guild.roles.cache.has(id));
    if (hasAny) return topRoles;

    // Smart fallback: find roles by name in this guild
    const result = {};
    for (const lvl of [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]) {
      const role = guild.roles.cache.find(r => {
        const lower = r.name.toLowerCase();
        return lower.includes(`level ${lvl}`) || lower.includes(`level-${lvl}`);
      });
      if (role) result[String(lvl)] = role.id;
    }
    return result;
  },

  // Log an alert to the configured security channel
  async logSecurity(guild, embed) {
    if (!guild) return;
    const ch = this.getGuildChannel(guild, 'security_log_channel_id') ||
      this.getGuildChannel(guild, 'log_channel_id');
    if (ch) {
      await ch.send({ embeds: [embed] }).catch(() => {});
    }
  },

  formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
    if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  },

  // Protected categories that can NEVER be made public for non-whitelisted members
  PROTECTED_CATEGORIES: ['admin', 'moderation', 'antinuke', 'nuke', 'security'],

  // Default allowed public commands for standard servers
  DEFAULT_PUBLIC_COMMANDS: [
    'rank', 'level', 'vcrank', 'vclevel', 'xp',
    'leaderboard', 'top', 'vctop', 'lb',
    'chatrank', 'chatlevel', 'crank', 'clevel', 'cxp',
    'chatleaderboard', 'chatlb', 'chattop', 'clb',
    'ping', 'help', 'avatar', 'banner', 'userinfo', 'serverinfo',
    'afk', 'kikiquote', 'tarot', '8ball',
    'voicemaster', 'vm', 'tempvc',
    'invites', 'invite', 'botinvite', 'addbot', 'join', 'invs', 'myinvites', 'invitetop', 'invitelb', 'inviteleaderboard'
  ],

  // Check if a command is allowed for non-whitelisted members
  isCommandPublic(commandName, commandObj = null) {
    if (!commandName) return false;
    const cleanCmd = String(commandName).toLowerCase().trim();

    // Never allow sensitive administration or destructive commands to be public
    const blockedCommands = [
      'nuke', 'ban', 'kick', 'purge', 'whitelist', 'wl', 'antinuke', 'lockdown',
      'setuplogs', 'setuplevelroles', 'levelroles', 'setwelcome', 'setleave', 'prefix',
      'cmdpanel', 'commandpanel', 'chatlevelpanel', 'autorolepanel', 'autorole', 'setautorole', 'addxp', 'givexp', 'setxp', 'vctest',
      'deafafkpanel', 'deafafk', 'vcafk', 'afkmover', 'deafmover', 'deafpanel', 'vcafkpanel', 'backup', 'ticketsetup',
      'savedcommands', 'savedcmds', 'autocmds', 'autoexec', 'savecmd', 'unsavecmd'
    ];
    if (blockedCommands.includes(cleanCmd)) return false;

    const cfg = this.loadConfig();
    const publicCommands = (cfg.public_commands || this.DEFAULT_PUBLIC_COMMANDS).map(c => c.toLowerCase());

    // Check direct command list
    if (publicCommands.includes(cleanCmd)) return true;

    // Check allowed categories if any (e.g. 'utility', 'fun', 'games', 'social')
    const publicCategories = (cfg.public_categories || []).map(c => c.toLowerCase());
    if (commandObj && commandObj.category) {
      const cat = commandObj.category.toLowerCase();
      if (!this.PROTECTED_CATEGORIES.includes(cat) && publicCategories.includes(cat)) {
        return true;
      }
    }

    return false;
  }
};

module.exports = KIKI;
