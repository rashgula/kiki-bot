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

  // Log an alert to the configured security channel
  async logSecurity(guild, embed) {
    const cfg = this.loadConfig();
    const logId = cfg.log_channel_id || cfg.security_log_channel_id;
    if (logId && guild) {
      const ch = guild.channels.cache.get(logId);
      if (ch) await ch.send({ embeds: [embed] }).catch(() => {});
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
    'invites', 'invite', 'invs', 'myinvites', 'invitetop', 'invitelb', 'inviteleaderboard'
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
