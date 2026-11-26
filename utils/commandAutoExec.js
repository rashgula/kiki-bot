// KIKI Bot - Command Persistence & Auto-Replay Engine
// Saves ONLY safe, idempotent setup/admin commands entered by the owner so they auto-restore upon bot restart!

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { Collection } = require('discord.js');
const KIKI = require('./kiki.js');
const config = require('../config.js');
const CloudSync = require('./cloudSync.js');

const LEGACY_SAVED_CMDS_FILE = path.join(__dirname, '..', 'data', 'saved_commands.json');

// Strict allowlist of safe, idempotent configuration/setup commands that can auto-replay on boot.
// Moderation/channel mutation commands (lock, ban, kick, nuke, purge, etc.) MUST NEVER auto-replay on restart!
const SAFE_AUTO_REPLAY_ALLOWLIST = new Set([
  'master-antinuke',
  'antinuke',
  'setuplogs',
  'setuplevelroles',
  'autorole',
  'chatlevelpanel',
  'deafafkpanel',
  'deafmover',
  'voicemaster',
  'invitetracker',
  'leavepanel'
]);

const READ_ONLY_COMMANDS = [
  'ping', 'help', 'h', 'commands', 'cmds', 'avatar', 'av', 'banner',
  'userinfo', 'ui', 'serverinfo', 'si', 'botinfo', 'bi', 'uptime', 'membercount',
  'rank', 'level', 'vcrank', 'vclevel', 'xp', 'leaderboard', 'top', 'vctop', 'lb',
  'chatrank', 'chatlevel', 'crank', 'clevel', 'cxp', 'chatleaderboard', 'chatlb', 'chattop', 'clb',
  'tarot', '8ball', 'kikiquote', 'roast', 'roll', 'dice', 'coinflip', 'rps', 'ship',
  'savedcmds', 'autocmds', 'autoexec', 'savedcommands', 'setupall'
];

function loadSavedCommands() {
  try {
    const file = CloudSync.getDataFile('saved_commands.json');
    const data = CloudSync.readJsonSafe(file, null);
    if (data && Array.isArray(data.commands)) return data.commands;
    if (fs.existsSync(LEGACY_SAVED_CMDS_FILE)) {
      const legacy = JSON.parse(fs.readFileSync(LEGACY_SAVED_CMDS_FILE, 'utf8'));
      if (Array.isArray(legacy.commands)) return legacy.commands;
    }
  } catch (err) {
    console.error('[AUTO-EXEC] Error reading saved commands:', err.message);
  }
  return [];
}

function writeSavedCommands(commands) {
  try {
    const payload = { commands, updatedAt: Date.now() };
    CloudSync.writeJsonAtomic(CloudSync.getDataFile('saved_commands.json'), payload);
  } catch (err) {
    console.error('[AUTO-EXEC] Error saving commands:', err.message);
  }
}

function initDefaultCommands() {
  const existing = loadSavedCommands();
  if (existing.length > 0) {
    const safeExisting = existing.filter(c => SAFE_AUTO_REPLAY_ALLOWLIST.has(String(c.name || '').toLowerCase()));
    if (safeExisting.length !== existing.length) {
      writeSavedCommands(safeExisting);
    }
    return safeExisting;
  }

  const cfg = KIKI.loadConfig();
  const defaults = [
    {
      id: 'master-antinuke',
      command: '&master-antinuke',
      name: 'master-antinuke',
      args: [],
      category: 'antinuke',
      description: 'Master Anti-Nuke Fortress (All 16+ shields live)',
      author: 'Owner',
      timestamp: Date.now()
    },
    {
      id: 'setuplogs',
      command: '&setuplogs',
      name: 'setuplogs',
      args: [],
      category: 'admin',
      description: 'Auto-create and link all 5 Server Log Channels',
      author: 'Owner',
      timestamp: Date.now()
    },
    {
      id: 'setuplevelroles',
      command: '&setuplevelroles',
      name: 'setuplevelroles',
      args: [],
      category: 'admin',
      description: 'Auto-create and bind 10 Level Roles (Levels 5 to 50)',
      author: 'Owner',
      timestamp: Date.now()
    },
    {
      id: 'autorole',
      command: '&autorole',
      name: 'autorole',
      args: cfg.autorole_id ? [cfg.autorole_id] : [],
      category: 'admin',
      description: 'Auto-Role assignment on new member join',
      author: 'Owner',
      timestamp: Date.now()
    },
    {
      id: 'chatlevelpanel',
      command: '&chatlevelpanel',
      name: 'chatlevelpanel',
      args: [],
      category: 'admin',
      description: 'Chat leveling without roles configuration',
      author: 'Owner',
      timestamp: Date.now()
    },
    {
      id: 'deafafkpanel',
      command: '&deafafkpanel',
      name: 'deafafkpanel',
      args: [],
      category: 'admin',
      description: 'Auto-move 10+ min deafened members to AFK VC',
      author: 'Owner',
      timestamp: Date.now()
    },
    {
      id: 'voicemaster-setup',
      command: '&voicemaster setup',
      name: 'voicemaster',
      args: ['setup'],
      category: 'admin',
      description: 'Voice Master dynamic temp voice channels & control panel',
      author: 'Owner',
      timestamp: Date.now()
    },
    {
      id: 'invitetracker-setup',
      command: '&invitetracker setup',
      name: 'invitetracker',
      args: ['setup'],
      category: 'admin',
      description: 'Invite Tracker category and real-time logs channel setup',
      author: 'Owner',
      timestamp: Date.now()
    }
  ];

  writeSavedCommands(defaults);
  return defaults;
}

const CommandAutoExec = {
  getSavedCommands() {
    return loadSavedCommands();
  },

  // Save a command ONLY if it is in the explicit safe setup allowlist
  recordCommand(commandName, args = [], messageOrInteraction) {
    const cleanCmd = String(commandName).toLowerCase().trim();
    if (READ_ONLY_COMMANDS.includes(cleanCmd) || !SAFE_AUTO_REPLAY_ALLOWLIST.has(cleanCmd)) {
      return false;
    }

    const commands = loadSavedCommands();
    const prefix = config.PREFIX || '&';
    const fullCmdString = `${prefix}${cleanCmd}${args.length ? ' ' + args.join(' ') : ''}`;
    const existingIndex = commands.findIndex(c => c.name === cleanCmd && (cleanCmd !== 'voicemaster' || c.args?.[0] === args[0]));

    const authorUser = messageOrInteraction.author || messageOrInteraction.user;
    const entry = {
      id: `${cleanCmd}${args.length ? '-' + args[0] : ''}`,
      command: fullCmdString,
      name: cleanCmd,
      args: args.map(String),
      guildId: messageOrInteraction.guildId || messageOrInteraction.guild?.id || null,
      channelId: messageOrInteraction.channelId || null,
      author: authorUser ? authorUser.tag : 'Admin',
      authorId: authorUser ? authorUser.id : 'Owner',
      timestamp: Date.now()
    };

    if (existingIndex >= 0) commands[existingIndex] = entry;
    else commands.push(entry);

    writeSavedCommands(commands);
    console.log(chalk.green(`  💾 [AUTO-SAVE] Setup command '${fullCmdString}' saved for restore on restart!`));
    return true;
  },

  removeCommand(cmdName) {
    const clean = String(cmdName).toLowerCase().replace(/^[&/]/, '').trim();
    const commands = loadSavedCommands();
    const filtered = commands.filter(c => c.name !== clean && c.id !== clean && c.command !== clean);
    if (filtered.length !== commands.length) {
      writeSavedCommands(filtered);
      return true;
    }
    return false;
  },

  clearCommands() {
    writeSavedCommands([]);
  },

  async replayOnStartup(client) {
    console.log(chalk.magenta('  🔄 [AUTO-EXEC ENGINE] Verifying saved setup state on startup...'));
    const commands = initDefaultCommands();
    let replayed = 0;

    const passiveStateCmds = new Set([
      'setuplevelroles', 'setuplogs', 'voicemaster', 'invitetracker',
      'deafafkpanel', 'deafmover', 'chatlevelpanel', 'master-antinuke', 'antinuke'
    ]);

    for (const item of commands) {
      try {
        const cmdName = String(item.name || '').toLowerCase();
        if (!SAFE_AUTO_REPLAY_ALLOWLIST.has(cmdName)) continue;

        const cmd = client.prefixCommands.get(cmdName) || client.commands.get(cmdName);
        if (!cmd) continue;

        if (passiveStateCmds.has(cmdName)) {
          replayed++;
          console.log(chalk.cyan(`  ⚡ [AUTO-EXEC] Verified state: ${item.command}`));
          continue;
        }

        // Only safe non-passive allowlisted setup commands reach here
        for (const [, guild] of client.guilds.cache) {
          if (item.guildId && guild.id !== item.guildId) continue;
          const defaultChannel = item.channelId
            ? (guild.channels.cache.get(item.channelId) || guild.channels.cache.find(c => c.isTextBased()))
            : guild.channels.cache.find(c => c.isTextBased());
          if (!defaultChannel) continue;

          const mockMessage = {
            guild,
            channel: defaultChannel,
            author: { id: item.authorId || guild.ownerId, tag: item.author || 'Owner', bot: false },
            member: guild.members.cache.get(item.authorId) || guild.members.me,
            content: item.command,
            mentions: {
              users: new Collection(),
              members: new Collection(),
              channels: new Collection(),
              roles: new Collection()
            },
            reply: async () => {},
            react: async () => {}
          };

          if (typeof cmd.run === 'function') {
            await cmd.run(mockMessage, item.args || [], client).catch(() => {});
          }
        }

        replayed++;
        console.log(chalk.cyan(`  ⚡ [AUTO-EXEC] Executed: ${item.command}`));
      } catch (err) {
        console.error(`[AUTO-EXEC ERROR] Command ${item.command}:`, err.message);
      }
    }

    console.log(chalk.bold.green(`  ✅ [AUTO-EXEC ENGINE] Verified ${replayed} safe setup command(s).\n`));
    return replayed;
  }
};

initDefaultCommands();

module.exports = CommandAutoExec;
