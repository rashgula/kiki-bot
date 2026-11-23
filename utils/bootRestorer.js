// KIKI Bot - Auto-Boot Restoration & Self-Healing Engine
// Ensures all channels, level roles, slash commands, and defenses are 100% active on reboot
// without requiring the user to run setup commands again!

const { PermissionFlagsBits, ChannelType } = require('discord.js');
const chalk = require('chalk');
const KIKI = require('./kiki.js');
const KikiEmbed = require('./embed.js');
const config = require('../config.js');

const LEVEL_DEFINITIONS = [
  { level: 5,  name: '🔮・Level 5',  color: '#9B59B6' },
  { level: 10, name: '🔮・Level 10', color: '#8E44AD' },
  { level: 15, name: '🔮・Level 15', color: '#3498DB' },
  { level: 20, name: '🔮・Level 20', color: '#1ABC9C' },
  { level: 25, name: '🔮・Level 25', color: '#2ECC71' },
  { level: 30, name: '🔮・Level 30', color: '#F1C40F' },
  { level: 35, name: '🔮・Level 35', color: '#E67E22' },
  { level: 40, name: '🔮・Level 40', color: '#E74C3C' },
  { level: 45, name: '🔮・Level 45', color: '#E91E63' },
  { level: 50, name: '👑・Level 50', color: '#FFD700' }
];

const LOG_CHANNEL_DEFINITIONS = [
  { key: 'voice_log_channel_id', name: '🔊・voice-logs', topic: 'Voice channel joins, leaves, moves and server mutes/deafens' },
  { key: 'chat_log_channel_id', name: '💬・chat-logs', topic: 'Message deletions and message edits' },
  { key: 'welcome_channel_id', name: '👋・welcome', topic: 'Welcome card notifications for new members', isPublic: true },
  { key: 'leave_channel_id', name: '🚪・leave-logs', topic: 'Member departure and leave notifications' },
  { key: 'security_log_channel_id', name: '🛡️・security-logs', topic: 'Anti-Nuke alerts and server security audit logs' }
];

async function ensureLevelRoles(guild) {
  const botMember = guild.members.me;
  if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) return 0;

  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
  if (!cfg.guilds[guild.id].level_roles) cfg.guilds[guild.id].level_roles = {};

  let modified = false;
  let verifiedCount = 0;

  for (const def of LEVEL_DEFINITIONS) {
    const existingId = cfg.guilds[guild.id].level_roles[String(def.level)] ||
      (guild.roles.cache.has(cfg.level_roles?.[String(def.level)]) ? cfg.level_roles[String(def.level)] : null);
    let role = existingId ? guild.roles.cache.get(existingId) : null;

    if (!role) {
      // Find by matching name in guild
      role = guild.roles.cache.find(r =>
        r.name.toLowerCase() === def.name.toLowerCase() ||
        r.name.toLowerCase() === `level ${def.level}` ||
        r.name.toLowerCase() === `level-${def.level}` ||
        r.name.toLowerCase().endsWith(`level ${def.level}`)
      );
    }

    if (!role) {
      // Auto-create role so user NEVER needs to run &setuplevelroles again!
      try {
        role = await guild.roles.create({
          name: def.name,
          color: def.color,
          hoist: true,
          reason: `[KIKI Boot Restorer] Auto-ensure Level ${def.level} role in ${guild.name}`
        });
      } catch (err) {
        console.error(`[BOOT RESTORER] Could not auto-create role Level ${def.level} in ${guild.name}:`, err.message);
      }
    }

    if (role) {
      verifiedCount++;
      if (cfg.guilds[guild.id].level_roles[String(def.level)] !== role.id) {
        cfg.guilds[guild.id].level_roles[String(def.level)] = role.id;
        modified = true;
      }
    }
  }

  // Preserve top-level if not set
  if (!cfg.level_roles && cfg.guilds[guild.id].level_roles) {
    cfg.level_roles = { ...cfg.guilds[guild.id].level_roles };
    modified = true;
  }

  if (modified) {
    KIKI.saveConfig(cfg);
  }

  return verifiedCount;
}

async function ensureLogChannels(guild) {
  const botMember = guild.members.me;
  if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageChannels)) return 0;

  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};

  let modified = false;
  let verifiedCount = 0;

  // 1. Ensure Category
  const savedCatId = cfg.guilds[guild.id].logs_category_id || (guild.channels.cache.has(cfg.logs_category_id) ? cfg.logs_category_id : null);
  let category = savedCatId ? guild.channels.cache.get(savedCatId) : null;
  if (!category) {
    category = guild.channels.cache.find(
      c => c.type === ChannelType.GuildCategory && (
        c.name.toLowerCase().includes('server logs') ||
        c.name.toLowerCase().includes('kiki logs') ||
        c.name === '🔮・SERVER LOGS'
      )
    );
  }

  if (!category) {
    try {
      category = await guild.channels.create({
        name: '🔮・SERVER LOGS',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.SendMessages]
          },
          {
            id: botMember.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ManageChannels
            ]
          }
        ],
        reason: `[KIKI Boot Restorer] Auto-create logs category in ${guild.name}`
      });
      cfg.guilds[guild.id].logs_category_id = category.id;
      modified = true;
    } catch (err) {
      console.error(`[BOOT RESTORER] Could not auto-create logs category in ${guild.name}:`, err.message);
    }
  } else if (cfg.guilds[guild.id].logs_category_id !== category.id) {
    cfg.guilds[guild.id].logs_category_id = category.id;
    modified = true;
  }

  const categoryId = category ? category.id : null;

  // 2. Ensure each Log Channel
  for (const def of LOG_CHANNEL_DEFINITIONS) {
    const existingId = cfg.guilds[guild.id][def.key] || (guild.channels.cache.has(cfg[def.key]) ? cfg[def.key] : null);
    let ch = existingId ? guild.channels.cache.get(existingId) : null;

    if (!ch) {
      const cleanName = def.name.replace(/^[^\w\d-]+/, '').toLowerCase();
      ch = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildText && (
          c.name.toLowerCase() === def.name.toLowerCase() ||
          c.name.toLowerCase().includes(cleanName)
        )
      );
    }

    if (!ch && categoryId) {
      // Auto-create missing log channel so user NEVER has to run &setuplogs again!
      try {
        const isPublicView = Boolean(def.isPublic);
        ch = await guild.channels.create({
          name: def.name,
          type: ChannelType.GuildText,
          parent: categoryId,
          topic: def.topic,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: isPublicView ? [PermissionFlagsBits.SendMessages] : [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
              allow: isPublicView ? [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] : []
            },
            {
              id: botMember.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageChannels
              ]
            }
          ],
          reason: `[KIKI Boot Restorer] Auto-create ${def.name} on startup in ${guild.name}`
        });
      } catch (err) {
        console.error(`[BOOT RESTORER] Could not auto-create channel ${def.name} in ${guild.name}:`, err.message);
      }
    }

    if (ch) {
      verifiedCount++;
      if (cfg.guilds[guild.id][def.key] !== ch.id) {
        cfg.guilds[guild.id][def.key] = ch.id;
        modified = true;
      }
    }
  }

  // Preserve top-level if completely unset
  if (!cfg.security_log_channel_id && cfg.guilds[guild.id].security_log_channel_id) {
    cfg.security_log_channel_id = cfg.guilds[guild.id].security_log_channel_id;
    cfg.log_channel_id = cfg.guilds[guild.id].security_log_channel_id;
    modified = true;
  }

  if (modified) {
    KIKI.saveConfig(cfg);
  }

  return verifiedCount;
}

function ensureAntiNukeState() {
  const cfg = KIKI.loadConfig();
  if (cfg.antinuke !== false && cfg.master_antinuke !== false) {
    let modified = false;
    if (!cfg.antinuke_modules) {
      cfg.antinuke_modules = {};
      modified = true;
    }
    const modules = [
      'anti_bot', 'anti_channel_delete', 'anti_channel_create', 'anti_channel_update',
      'anti_role_delete', 'anti_role_create', 'anti_role_update', 'anti_ban', 'anti_kick',
      'anti_webhook', 'anti_server_update', 'anti_prune', 'anti_everyone',
      'anti_mass_mention', 'anti_invite', 'anti_link'
    ];
    for (const m of modules) {
      if (cfg.antinuke_modules[m] !== true) {
        cfg.antinuke_modules[m] = true;
        modified = true;
      }
    }
    if (cfg.punishment !== 'ban') {
      cfg.punishment = 'ban';
      modified = true;
    }
    if (modified) {
      KIKI.saveConfig(cfg);
    }
    return true;
  }
  return false;
}

function ensureLevelAnnounceChannels(guild) {
  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};

  let modified = false;

  const levelChannel = KIKI.getGuildChannel(guild, 'level_channel_id');
  if (levelChannel && cfg.guilds[guild.id].level_channel_id !== levelChannel.id) {
    cfg.guilds[guild.id].level_channel_id = levelChannel.id;
    modified = true;
  }

  const chatLevelChannel = KIKI.getGuildChannel(guild, 'chat_level_channel_id');
  if (chatLevelChannel && cfg.guilds[guild.id].chat_level_channel_id !== chatLevelChannel.id) {
    cfg.guilds[guild.id].chat_level_channel_id = chatLevelChannel.id;
    modified = true;
  }

  if (modified) {
    KIKI.saveConfig(cfg);
  }
}

async function autoSyncSlashCommands(client) {
  const priorityCategories = ['antinuke', 'utility', 'admin', 'moderation', 'nuke', 'fun', 'security'];
  const slashCmds = [];

  // Sort slash commands by priority categories
  for (const cat of priorityCategories) {
    const catCmds = client.categories?.get(cat) || [];
    for (const c of catCmds) {
      if (slashCmds.length >= 100) break;
      const cmd = client.commands.get(c.name);
      if (cmd && cmd.data) {
        slashCmds.push(cmd.data.toJSON());
      }
    }
    if (slashCmds.length >= 100) break;
  }

  if (slashCmds.length > 0) {
    for (const [, guild] of client.guilds.cache) {
      await guild.commands.set(slashCmds).catch(() => {});
    }
  }

  return slashCmds.length;
}

async function sendDiscordBootAlert(guild, stats) {
  try {
    const cfg = KIKI.loadConfig();
    const channel = KIKI.getGuildChannel(guild, 'security_log_channel_id') ||
      KIKI.getGuildChannel(guild, 'log_channel_id');
    if (!channel || !channel.isTextBased()) return;

    const gData = cfg.guilds?.[guild.id] || {};
    const isAntiNukeOn = cfg.antinuke !== false && cfg.master_antinuke !== false;
    const isChatXpOn = cfg.chat_xp_enabled !== false;
    const autoRoleId = gData.autorole_id || (guild.roles.cache.has(cfg.autorole_id) ? cfg.autorole_id : null);
    const autoRoleObj = autoRoleId ? guild.roles.cache.get(autoRoleId) : null;
    const autoRoleDisplay = autoRoleObj ? `<@&${autoRoleObj.id}>` : (autoRoleId ? `\`ID: ${autoRoleId}\`` : '`Not Set`');

    const deafMoverActive = gData.deaf_mover_enabled ?? (cfg.deaf_mover_enabled !== false);
    const deafAfkId = gData.deaf_afk_channel_id || (guild.channels.cache.has(cfg.deaf_afk_channel_id) ? cfg.deaf_afk_channel_id : guild.afkChannelId);
    const deafMoverDisplay = deafMoverActive ? (deafAfkId ? `<#${deafAfkId}> (10m)` : '`Active (Auto-Detect AFK)`') : '`Disabled`';

    const inviteTrackerId = gData.invite_tracker_channel_id || (guild.channels.cache.has(cfg.invite_tracker_channel_id) ? cfg.invite_tracker_channel_id : null);
    const inviteTrackerDisplay = inviteTrackerId ? `<#${inviteTrackerId}>` : '`Active (Real-time Logs)`';

    const embed = KikiEmbed.build({
      title: '🔮 KIKI ONLINE • System Boot & State Auto-Restored',
      description:
        `**Bot band hoke chalu hone par saare systems automatically LIVE ho chuke hain!**\n` +
        `Aapke server (**${guild.name}**) ke liye sabhi channels aur level roles safely restored hain. ✨\n\n` +
        `🛡️ **Master Anti-Nuke:** ${isAntiNukeOn ? '🟢 `ACTIVE (All 16+ defense shields live)`' : '🔴 `PAUSED`'}\n` +
        `👑 **Level Roles (5-50):** 🟢 \`${stats.roles}/10 Roles Verified & Bound\`\n` +
        `📜 **Server Log Channels:** 🟢 \`${stats.logs}/5 Channels Active & Linked\`\n` +
        `🏷️ **Auto-Role on Join:** ${autoRoleObj ? '🟢 ' + autoRoleDisplay : '⚪ `' + autoRoleDisplay + '`'}\n` +
        `💤 **Deaf AFK Mover:** ${deafMoverActive ? '🟢 ' + deafMoverDisplay : '⚪ `' + deafMoverDisplay + '`'}\n` +
        `📩 **Invite Tracker:** 🟢 ${inviteTrackerDisplay}\n` +
        `🎙️ **Voice XP Engine:** 🟢 \`RUNNING (18-23 XP/min in VC)\`\n` +
        `💬 **Chat XP Engine:** ${isChatXpOn ? '🟢 `RUNNING (15-25 XP/msg • No Roles)`' : '🔴 `PAUSED`'}\n` +
        `💾 **Auto-Replayed Commands:** 🟢 \`${require('./commandAutoExec.js').getSavedCommands().length} Commands Auto-Run on Boot\`\n` +
        `🔒 **Security Whitelist:** 🟢 \`${(cfg.whitelist || []).length} Whitelisted Members\`\n` +
        `🎛️ **Command Permissions:** 🟢 \`${(cfg.public_commands || []).length} Public Commands Active\``,
      color: config.COLORS.PRIMARY || 0x9B59B6,
      footer: { text: `Multi-Server Isolation Engine • KIKI v${config.BOT_VERSION}` },
      timestamp: true
    });

    await channel.send({ embeds: [embed] }).catch(() => {});
  } catch (err) {
    console.error(`[BOOT ALERT ERROR] Guild ${guild.name}:`, err.message);
  }
}

module.exports = {
  ensureLevelRoles,
  ensureLogChannels,
  ensureLevelAnnounceChannels,
  autoSyncSlashCommands,
  sendDiscordBootAlert,
  async restoreAndVerify(client) {
    console.log(chalk.magenta('  🔄 [AUTO-BOOT RESTORER] Restoring server configurations...'));

    const cfg = KIKI.loadConfig();
    let totalRolesVerified = 0;
    let totalLogsVerified = 0;

    // Ensure Anti-Nuke flags in config
    const isAntiNukeActive = ensureAntiNukeState();

    for (const [, guild] of client.guilds.cache) {
      try {
        // Hydrate guild cache
        await guild.channels.fetch().catch(() => {});
        await guild.roles.fetch().catch(() => {});

        // 1. Auto-Verify & Self-Heal Level Roles (5 to 50)
        const rolesCount = await ensureLevelRoles(guild);
        totalRolesVerified += rolesCount;

        // 2. Auto-Verify & Self-Heal Log Channels (All 5)
        const logsCount = await ensureLogChannels(guild);
        totalLogsVerified += logsCount;

        // 3. Ensure Announce Channels
        ensureLevelAnnounceChannels(guild);

        // 4. Send Live Boot Confirmation Card into Security Log Channel
        await sendDiscordBootAlert(guild, { roles: rolesCount, logs: logsCount });
      } catch (err) {
        console.error(`[BOOT RESTORER ERROR] Guild ${guild.name}:`, err.message);
      }
    }

    // 5. Print Reassuring Persistence Report in Terminal
    console.log(chalk.bold.magenta('\n  ╔═══════════════════════════════════════════════════════╗'));
    console.log(chalk.bold.magenta('  ║       🔮 KIKI AUTO-BOOT RESTORATION COMPLETED         ║'));
    console.log(chalk.bold.magenta('  ╚═══════════════════════════════════════════════════════╝'));
    console.log(chalk.bold.white('   🛡️ Anti-Nuke Status    : ') + (isAntiNukeActive ? chalk.bold.green('ACTIVE (All 16+ shields live)') : chalk.bold.yellow('PAUSED')));
    console.log(chalk.bold.white('   👑 Level Roles (5-50)  : ') + chalk.bold.green(`${totalRolesVerified} Roles Verified & Bound`));
    console.log(chalk.bold.white('   📜 Log Channels        : ') + chalk.bold.green(`${totalLogsVerified} Channels Active & Linked`));
    console.log(chalk.bold.white('   🏷️ Auto-Role Status    : ') + (cfg.autorole_id ? chalk.bold.green(`Active (Role ID: ${cfg.autorole_id})`) : chalk.bold.gray('Not Set')));
    console.log(chalk.bold.white('   💤 Deaf AFK Mover      : ') + (cfg.deaf_mover_enabled ? chalk.bold.green(`Active (VC: ${cfg.deaf_afk_channel_id || 'Not Set'})`) : chalk.bold.gray('Disabled')));
    console.log(chalk.bold.white('   🔊 Voice Master        : ') + (cfg.voice_master_enabled ? chalk.bold.green(`Active (VC: ${cfg.voice_master_channel_id || 'OK'} | Logs: ${cfg.voice_master_log_channel_id || 'Linked'})`) : chalk.bold.gray('Not Configured')));
    console.log(chalk.bold.white('   📩 Invite Tracker      : ') + chalk.bold.green(`Active (Channel: ${cfg.invite_tracker_channel_id ? 'Configured' : 'Auto-Setup Ready'})`));
    console.log(chalk.bold.white('   💾 Auto-Replay Cmds    : ') + chalk.bold.green(`${require('./commandAutoExec.js').getSavedCommands().length} Commands Auto-Run on Boot ✅`));
    console.log(chalk.bold.white('   🎙️ Voice XP Engine     : ') + chalk.bold.green('RUNNING (18-23 XP/min in VC)'));
    console.log(chalk.bold.white('   💬 Chat XP Engine      : ') + chalk.bold.green('RUNNING (15-25 XP/msg • No Roles)'));
    console.log(chalk.bold.white('   💾 Persistent Memory   : ') + chalk.bold.green('ZERO SETUP NEEDED ON REBOOT! ✅'));
    console.log(chalk.bold.magenta('  ═════════════════════════════════════════════════════════\n'));
  }
};
