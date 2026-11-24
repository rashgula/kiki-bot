// KIKI Bot - Command Documentation & Sync Engine
// Automatically creates and maintains the "kiki all cmd" folder with all custom and built-together commands

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const config = require('../config.js');

const TARGET_FOLDER = path.join(__dirname, '..', 'kiki all cmd');
const REGISTRY_FILE = path.join(TARGET_FOLDER, 'commands_registry.json');
const BUILT_TOGETHER_FILE = path.join(TARGET_FOLDER, 'BUILT_TOGETHER_COMMANDS.md');
const ALL_COMMANDS_FILE = path.join(TARGET_FOLDER, 'ALL_BOT_COMMANDS.md');
const README_FILE = path.join(TARGET_FOLDER, 'README.md');

// List of custom features and commands built together in this session
const BUILT_TOGETHER_MODULES = [
  {
    module: 'Automated Level Roles System (5 - 50)',
    description: 'Automatic 10 Level Roles creation, Voice XP Engine (18-23 XP/min), Rank cards & Leaderboards',
    commands: [
      { name: '&setuplevelroles', slash: '/setuplevelroles', aliases: ['levelroles', 'setuplevels', 'levelsetup'], desc: '1-click command to automatically create and bind all 10 Level Roles (Level 5 to Level 50)' },
      { name: '&rank', slash: '/rank', aliases: ['vcrank', 'level', 'vclevel', 'xp'], desc: 'Check current Voice Level, Total XP, and visual progress to Next Role' },
      { name: '&leaderboard', slash: '/leaderboard', aliases: ['top', 'vctop', 'lb'], desc: 'View top 10 Voice XP members in the server' },
      { name: '&addxp', slash: null, aliases: ['givexp', 'setxp'], desc: 'Admin command to instantly grant custom XP to any member for testing' }
    ],
    roles: [
      'Level 5 (843 XP) -> 🔮・Level 5',
      'Level 10 (2,385 XP) -> 🔮・Level 10',
      'Level 15 (4,379 XP) -> 🔮・Level 15',
      'Level 20 (6,756 XP) -> 🔮・Level 20',
      'Level 25 (9,477 XP) -> 🔮・Level 25',
      'Level 30 (12,518 XP) -> 🔮・Level 30',
      'Level 35 (15,860 XP) -> 🔮・Level 35',
      'Level 40 (19,489 XP) -> 🔮・Level 40',
      'Level 45 (23,391 XP) -> 🔮・Level 45',
      'Level 50 (27,554 XP) -> 👑・Level 50'
    ]
  },
  {
    module: 'Strict Whitelist & Public Command Access Control Panel',
    description: 'Restricts all bot commands to whitelisted members only, with an interactive panel to allow public commands',
    commands: [
      { name: '&cmdpanel', slash: '/cmdpanel', aliases: ['commandpanel', 'cp'], desc: 'Interactive dropdown panel to select which commands non-whitelisted members can use' },
      { name: '&whitelist add @user', slash: '/whitelist add', aliases: ['wl add'], desc: 'Add trusted user to bypass bot security and command restrictions' },
      { name: '&whitelist remove @user', slash: '/whitelist remove', aliases: ['wl remove'], desc: 'Remove user from whitelist' },
      { name: '&whitelist list', slash: '/whitelist list', aliases: ['wl list'], desc: 'View all whitelisted users' },
      { name: '&whitelist clear', slash: '/whitelist clear', aliases: ['wl clear'], desc: 'Clear all whitelisted users' }
    ]
  },
  {
    module: 'Master Anti-Nuke Fortress & Strict Ownership Guard',
    description: 'Server Owner / Bot Owner locked defense system with 16+ real-time security shields',
    commands: [
      { name: '&master-antinuke', slash: '/master-antinuke', aliases: ['man', 'antinuke master'], desc: 'Single-click master switch to toggle all 16+ defense shields (Owner Only)' },
      { name: '&antinuke enable / disable', slash: '/antinuke enable', aliases: ['an on', 'an off'], desc: 'Enable or disable global anti-nuke defense' },
      { name: '&antinuke-lockdown', slash: '/lock-all', aliases: ['lockdown'], desc: 'Emergency panic lockdown to freeze all channels during raid' }
    ]
  },
  {
    module: 'Chat Leveling System with Panel (No Roles, XP Only)',
    description: 'Independent chat XP tracking (15-25 XP/msg) with channel filter & announcement control panel',
    commands: [
      { name: '&chatlevelpanel', slash: '/chatlevelpanel', aliases: ['chatpanel', 'clpanel'], desc: 'Interactive panel with Channel Select Menu to set chat level announcement channel' },
      { name: '&chatrank', slash: null, aliases: ['crank', 'chatlevel', 'clevel', 'cxp'], desc: 'Check Chat Level and Chat XP stats' },
      { name: '&chatleaderboard', slash: null, aliases: ['chatlb', 'chattop', 'clb'], desc: 'View top chatters leaderboard' }
    ]
  },
  {
    module: 'Interactive Auto-Role Setup Panel',
    description: 'Assigns a configured role automatically to new members joining the server',
    commands: [
      { name: '&autorolepanel', slash: '/autorolepanel', aliases: ['arpanel'], desc: 'Interactive panel with Role Select Menu & dedicated Save/Run button' },
      { name: '&autorole @role', slash: null, aliases: ['setautorole'], desc: 'Directly set the role to give on member join' }
    ]
  },
  {
    module: 'Automated Server Log Channels Setup',
    description: '1-click creation of Server Logs category and all 5 dedicated log channels',
    commands: [
      { name: '&setuplogs', slash: '/setuplogs', aliases: ['setup-logs', 'logsetup', 'createlogs'], desc: 'Auto-creates 🔮・SERVER LOGS category and 5 log channels' },
      { name: '&log-channel-voice #channel', slash: null, aliases: [], desc: 'Manually bind voice logs channel' },
      { name: '&log-channel-messages #channel', slash: null, aliases: [], desc: 'Manually bind message delete/edit logs channel' },
      { name: '&setwelcome #channel', slash: '/setwelcome', aliases: [], desc: 'Set welcome greetings channel' },
      { name: '&setleave #channel', slash: '/setleave', aliases: [], desc: 'Set leave departure channel' }
    ]
  },
  {
    module: 'Deaf AFK Voice Mover Engine & Interactive Panel',
    description: 'Auto-moves members continuously deafened for 10+ minutes into a selected AFK voice channel',
    commands: [
      { name: '&deafafkpanel', slash: '/deafafkpanel', aliases: ['deafafk', 'vcafk', 'afkmover', 'deafmover'], desc: 'Interactive panel with VC Dropdown and dedicated 🚀 Run & Save Engine button' }
    ]
  },
  {
    module: 'Voice Master (Custom Temp Voice Channels & Audit Logs)',
    description: 'Custom temporary voice channel creator with Join-to-Create, control panel & dedicated audit logs',
    commands: [
      { name: '&voicemaster setup', slash: '/voicemaster setup', aliases: ['&vm setup', '&tempvc setup'], desc: 'Auto-creates 🔊〢Voice Master category, ➕〢Join to Create VC, 🔊〢voice-control panel & 🔊〢vm-logs' },
      { name: '&voicemaster panel', slash: '/voicemaster panel', aliases: ['&vm panel'], desc: 'Resend Voice Master interactive control panel' },
      { name: '&voicemaster setlog #channel', slash: '/voicemaster setlog', aliases: ['&vm setlog'], desc: 'Set custom Voice Master audit log channel' },
      { name: '&vm lock / &vm unlock', slash: null, aliases: [], desc: 'Lock or unlock temporary voice channel' },
      { name: '&vm hide / &vm unhide', slash: null, aliases: [], desc: 'Hide or unhide temporary voice channel' },
      { name: '&vm rename <new name>', slash: null, aliases: [], desc: 'Rename voice channel' },
      { name: '&vm limit <0-99>', slash: null, aliases: [], desc: 'Set voice channel member limit' },
      { name: '&vm kick @user', slash: null, aliases: [], desc: 'Disconnect a user from your channel' },
      { name: '&vm permit @user', slash: null, aliases: [], desc: 'Allow user to join even if channel is locked' },
      { name: '&vm claim', slash: null, aliases: [], desc: 'Claim ownership of voice channel if owner left' },
      { name: '&vm delete', slash: null, aliases: [], desc: 'Delete voice channel immediately' }
    ]
  },
  {
    module: 'Command Persistence & Auto-Replay Engine',
    description: 'Automatically records every command run by the owner and auto-replays/restores them on restart',
    commands: [
      { name: '&savedcommands', slash: '/savedcommands', aliases: ['savedcmds', 'autocmds', 'autoexec'], desc: 'View all saved commands that auto-run on reboot, with Re-run All Now button' },
      { name: '&savecmd <command>', slash: null, aliases: [], desc: 'Manually add any command to the auto-replay list' },
      { name: '&unsavecmd <command>', slash: null, aliases: [], desc: 'Remove a command from the auto-replay list' }
    ]
  },
  {
    module: 'Help Command Embed Chunking & Bugfix',
    description: 'Fixed 3-second timeout and 4,096 char limit error, completely branded as KIKI',
    commands: [
      { name: '&help', slash: '/help', aliases: ['h', 'commands', 'cmds'], desc: 'Browse all 1,130+ commands across 10 categories with fast chunked embeds' }
    ]
  },
  {
    module: 'Invite Tracker & Inviter History System (Category & Logs Setup)',
    description: 'Tracks who invited each member, all-time total invites per user, join/leave real-time audit logs, and automatic category & channel creation',
    commands: [
      { name: '&invitetracker setup', slash: '/invitetracker setup', aliases: ['invsetup', 'invtrack'], desc: '1-click: Auto-create 📩〢INVITE TRACKER category and 📩〢invite-logs channel with read-only permissions' },
      { name: '&invites [@user]', slash: '/invites [user]', aliases: ['invite', 'invs', 'myinvites'], desc: 'Check member invite stats (👑 Aaj tak Total, Active joins, Leaves, Fakes, and Bonus)' },
      { name: '&invitetop', slash: '/invitetop', aliases: ['invitelb', 'inviteleaderboard', 'topinvites'], desc: 'View Top 10 Inviters in the server' },
      { name: '&invitetracker setchannel #ch', slash: '/invitetracker setchannel', aliases: [], desc: 'Bind custom channel for invite join & leave notifications' },
      { name: '&invitetracker sync', slash: '/invitetracker sync', aliases: [], desc: 'Force re-sync cached invites with Discord API' },
      { name: '&addinvites @user <amount>', slash: '/addinvites', aliases: ['giveinvites', 'bonusinvites'], desc: 'Admin command to add or remove bonus invites for a member' }
    ]
  }
];

const CommandDocsSync = {
  // Ensure the target folder exists
  ensureDirectory() {
    if (!fs.existsSync(TARGET_FOLDER)) {
      fs.mkdirSync(TARGET_FOLDER, { recursive: true });
    }
  },

  // Scan all commands currently in the project
  scanAllCommands() {
    const commandsPath = path.join(__dirname, '..', 'commands');
    if (!fs.existsSync(commandsPath)) return {};

    const categories = fs.readdirSync(commandsPath).filter(f =>
      fs.statSync(path.join(commandsPath, f)).isDirectory()
    );

    const catalog = {};
    let total = 0;

    for (const cat of categories) {
      const catPath = path.join(commandsPath, cat);
      const files = fs.readdirSync(catPath).filter(f => f.endsWith('.js'));
      catalog[cat] = [];

      for (const file of files) {
        try {
          const filePath = path.join(catPath, file);
          const cmd = require(filePath);
          total++;

          const name = cmd.data?.name || cmd.name || file.replace('.js', '');
          const desc = cmd.data?.description || cmd.description || 'KIKI command';
          const aliases = cmd.aliases || [];
          const isSlash = !!(cmd.data && cmd.execute);
          const isPrefix = !!(cmd.name && cmd.run);

          catalog[cat].push({
            name,
            file,
            category: cat,
            description: desc,
            aliases,
            isSlash,
            isPrefix
          });
        } catch {}
      }
    }

    catalog._total = total;
    return catalog;
  },

  // Generate BUILT_TOGETHER_COMMANDS.md
  generateBuiltTogetherDoc() {
    let md = `# 🔮 KIKI • Commands Built Together with User\n\n`;
    md += `> **Folder:** \`kiki all cmd/\`\n`;
    md += `> **Purpose:** Ye folder aur file un saari commands aur modules ka complete record hai jo **User aur AI ne milke build kiye hain**!\n`;
    md += `> **Auto-Sync:** Aage jab bhi koi nayi command banegi, wo automatically is folder me add aur update ho jayegi.\n\n`;
    md += `═══════════════════════════════════════════════════════════════════\n\n`;

    BUILT_TOGETHER_MODULES.forEach((mod, idx) => {
      md += `## 🌟 ${idx + 1}. ${mod.module}\n`;
      md += `*${mod.description}*\n\n`;

      md += `| Command | Slash Command | Aliases | Description |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      for (const c of mod.commands) {
        const slashStr = c.slash ? `\`${c.slash}\`` : '`None`';
        const aliasStr = c.aliases.length ? c.aliases.map(a => `\`${a}\``).join(', ') : '`None`';
        md += `| \`${c.name}\` | ${slashStr} | ${aliasStr} | ${c.desc} |\n`;
      }
      md += `\n`;

      if (mod.roles) {
        md += `**👑 Configured Level Roles (5 to 50):**\n`;
        mod.roles.forEach(r => md += `- ${r}\n`);
        md += `\n`;
      }

      md += `───────────────────────────────────────────────────────────────────\n\n`;
    });

    md += `\n### ⚡ Auto-Sync Engine Information\n`;
    md += `Jab bhi aap koi nayi command create karenge ya project me command add hogi, bot startup par ya \`&synccmds\` chalane par ye documentation automatically update ho jayegi.\n`;

    fs.writeFileSync(BUILT_TOGETHER_FILE, md, 'utf8');
  },

  // Generate ALL_BOT_COMMANDS.md (Complete 1,130+ commands catalog)
  generateAllCommandsDoc(catalog) {
    let md = `# 📜 KIKI • All Bot Commands Directory (${catalog._total || 1130}+ Commands)\n\n`;
    md += `> Complete catalog of all commands loaded in KIKI Gothic Purple Bot.\n`;
    md += `> Prefix: \`${config.PREFIX || '&'}\` | Slash: \`/<command>\`\n`;
    md += `> Last Synchronized: ${new Date().toLocaleString()}\n\n`;
    md += `═══════════════════════════════════════════════════════════════════\n\n`;

    const catEmojis = {
      admin: '⚙️',
      antinuke: '🛡️',
      moderation: '🔨',
      utility: '📊',
      fun: '🎭',
      security: '🚨',
      nuke: '💥',
      economy: '🪙',
      games: '🎮',
      social: '👥'
    };

    for (const [cat, cmds] of Object.entries(catalog)) {
      if (cat === '_total') continue;
      const emoji = catEmojis[cat] || '🔮';
      md += `## ${emoji} ${cat.toUpperCase()} (${cmds.length} Commands)\n\n`;

      md += `| Command Name | Aliases | Type | Description |\n`;
      md += `| :--- | :--- | :---: | :--- |\n`;

      for (const cmd of cmds) {
        const aliasStr = cmd.aliases?.length ? cmd.aliases.map(a => `\`${a}\``).join(', ') : '—';
        const typeStr = (cmd.isPrefix ? 'Prefix (&)' : '') + (cmd.isSlash ? (cmd.isPrefix ? ' + Slash (/)' : 'Slash (/)') : '');
        md += `| \`${cmd.name}\` | ${aliasStr} | \`${typeStr || 'Prefix'}\` | ${cmd.description || 'Gothic command'} |\n`;
      }

      md += `\n───────────────────────────────────────────────────────────────────\n\n`;
    }

    fs.writeFileSync(ALL_COMMANDS_FILE, md, 'utf8');
  },

  // Generate commands_registry.json
  generateJsonRegistry(catalog) {
    const registry = {
      name: 'kiki-commands-registry',
      version: config.BOT_VERSION || '2.2',
      updatedAt: Date.now(),
      totalCommands: catalog._total || 0,
      builtTogetherModules: BUILT_TOGETHER_MODULES,
      categories: catalog
    };

    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf8');
  },

  // Generate README.md inside "kiki all cmd" folder
  generateReadme() {
    let md = `# 📁 kiki all cmd\n\n`;
    md += `Is folder me KIKI Bot ki saari commands aur khas taur par **ham dono ne jo commands banayi hain**, unka poora record aur documentation saved hai!\n\n`;
    md += `### 📄 Folder Contents:\n`;
    md += `1. **[\`BUILT_TOGETHER_COMMANDS.md\`](./BUILT_TOGETHER_COMMANDS.md)** — Ham dono ne jo custom commands, interactive panels aur systems banaye hain unki detailed guide.\n`;
    md += `2. **[\`ALL_BOT_COMMANDS.md\`](./ALL_BOT_COMMANDS.md)** — KIKI Bot ki saari 1,130+ commands ka complete categorized directory.\n`;
    md += `3. **[\`commands_registry.json\`](./commands_registry.json)** — Saari commands ka structured JSON database.\n\n`;
    md += `### 🔄 Automatic Sync:\n`;
    md += `Aage aap jo bhi command banayenge ya bot me add karenge, bot startup par ya \`&synccmds\` chalane par wo automatically is folder me save ho jayegi! ✨\n`;

    fs.writeFileSync(README_FILE, md, 'utf8');
  },

  // Master Synchronize function
  syncAll(quiet = false) {
    try {
      this.ensureDirectory();
      const catalog = this.scanAllCommands();
      this.generateBuiltTogetherDoc();
      this.generateAllCommandsDoc(catalog);
      this.generateJsonRegistry(catalog);
      this.generateReadme();

      if (!quiet) {
        console.log(chalk.bold.green(`  📁 [COMMAND DOCS SYNC] "kiki all cmd" folder updated with ${catalog._total}+ commands!`));
      }
      return catalog._total;
    } catch (err) {
      console.error(chalk.red('[COMMAND DOCS SYNC ERROR]'), err.message);
      return 0;
    }
  }
};

module.exports = CommandDocsSync;

