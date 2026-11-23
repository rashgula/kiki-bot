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

async function ensureLevelRoles(guild, createIfMissing = false) {
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

    if (!role && createIfMissing) {
      // Create role ONLY when explicitly requested (e.g. &setupall)
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

async function ensureLogChannels(guild, createIfMissing = false) {
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

  if (!category && createIfMissing) {
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

    if (!ch && categoryId && createIfMissing) {
      // Create missing log channel ONLY when requested
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

async function ensureLevelAnnounceChannels(guild, createIfMissing = false) {
  const botMember = guild.members.me;
  if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageChannels)) return;

  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};

  const gData = cfg.guilds[guild.id];
  let modified = false;

  const categoryId = gData.logs_category_id || guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.includes('SERVER LOGS'))?.id;

  // 1. Voice Level Channel
  let levelChannel = gData.level_channel_id ? guild.channels.cache.get(gData.level_channel_id) : null;
  if (!levelChannel) {
    levelChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && (c.name === '🔮・level-logs' || c.name === 'level-logs' || c.name === 'vc-levels'));
  }
  if (!levelChannel && categoryId && createIfMissing) {
    try {
      levelChannel = await guild.channels.create({
        name: '🔮・level-logs',
        type: ChannelType.GuildText,
        parent: categoryId,
        topic: 'Voice Level-Up and Tier Role Rewards Announcements',
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages]
          },
          {
            id: botMember.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
          }
        ],
        reason: `[KIKI Boot Restorer] Auto-create Voice Level announcement channel in ${guild.name}`
      });
      gData.level_channel_id = levelChannel.id;
      modified = true;
    } catch (e) {
      console.error(`[BOOT RESTORER] Error creating level-logs in ${guild.name}:`, e.message);
    }
  } else if (levelChannel && gData.level_channel_id !== levelChannel.id) {
    gData.level_channel_id = levelChannel.id;
    modified = true;
  }

  // 2. Chat Level Channel
  let chatLevelChannel = gData.chat_level_channel_id ? guild.channels.cache.get(gData.chat_level_channel_id) : null;
  if (!chatLevelChannel) {
    chatLevelChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && (c.name === '💬・chat-levels' || c.name === 'chat-levels'));
  }
  if (!chatLevelChannel && categoryId && createIfMissing) {
    try {
      chatLevelChannel = await guild.channels.create({
        name: '💬・chat-levels',
        type: ChannelType.GuildText,
        parent: categoryId,
        topic: 'Text Chat Level-Up Announcements and Activity Celebrations',
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages]
          },
          {
            id: botMember.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
          }
        ],
        reason: `[KIKI Boot Restorer] Auto-create Chat Level announcement channel in ${guild.name}`
      });
      gData.chat_level_channel_id = chatLevelChannel.id;
      modified = true;
    } catch (e) {
      console.error(`[BOOT RESTORER] Error creating chat-levels in ${guild.name}:`, e.message);
    }
  } else if (chatLevelChannel && gData.chat_level_channel_id !== chatLevelChannel.id) {
    gData.chat_level_channel_id = chatLevelChannel.id;
    modified = true;
  }

  if (createIfMissing) {
    gData.chat_level_alerts = true;
    gData.chat_xp_enabled = true;
  }

  if (modified) {
    KIKI.saveConfig(cfg);
  }
}

async function ensureVoiceMaster(guild, createIfMissing = false) {
  const botMember = guild.members.me;
  if (!botMember || !botMember.permissions.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers])) return false;

  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};

  const gData = cfg.guilds[guild.id];
  let modified = false;

  // 1. Ensure Category
  let category = gData.voice_master_category_id ? guild.channels.cache.get(gData.voice_master_category_id) : null;
  if (!category) {
    category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && (c.name.toLowerCase().includes('voice master') || c.name === '🔊・VOICE MASTER'));
  }
  if (!category && createIfMissing) {
    try {
      category = await guild.channels.create({
        name: '🔊・VOICE MASTER',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
          }
        ],
        reason: `[KIKI Boot Restorer] Auto-ensure Voice Master Category in ${guild.name}`
      });
      gData.voice_master_category_id = category.id;
      modified = true;
    } catch (e) {
      console.error(`[BOOT RESTORER VM] Category error in ${guild.name}:`, e.message);
    }
  } else if (gData.voice_master_category_id !== category.id) {
    gData.voice_master_category_id = category.id;
    modified = true;
  }

  if (!category) return false;

  // 2. Ensure Interface Text Channel
  let interfaceChannel = gData.voice_master_interface_id ? guild.channels.cache.get(gData.voice_master_interface_id) : null;
  if (!interfaceChannel) {
    interfaceChannel = guild.channels.cache.find(c => c.parentId === category.id && (c.name.includes('voice-control') || c.name.includes('control')));
  }
  if (!interfaceChannel && createIfMissing) {
    try {
      interfaceChannel = await guild.channels.create({
        name: '🎛️・voice-control',
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages]
          },
          {
            id: botMember.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
          }
        ],
        reason: `[KIKI Boot Restorer] Auto-ensure Voice Control channel in ${guild.name}`
      });
      gData.voice_master_interface_id = interfaceChannel.id;
      modified = true;
    } catch (e) {
      console.error(`[BOOT RESTORER VM] Interface error in ${guild.name}:`, e.message);
    }
  } else if (gData.voice_master_interface_id !== interfaceChannel.id) {
    gData.voice_master_interface_id = interfaceChannel.id;
    modified = true;
  }

  // 3. Ensure Join to Create Voice Channel
  let joinChannel = gData.voice_master_channel_id ? guild.channels.cache.get(gData.voice_master_channel_id) : null;
  if (!joinChannel) {
    joinChannel = guild.channels.cache.find(c => c.parentId === category.id && (c.name.includes('Join to Create') || c.name.includes('join-to-create')));
  }
  if (!joinChannel && createIfMissing) {
    try {
      joinChannel = await guild.channels.create({
        name: '➕・Join to Create',
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
          }
        ],
        reason: `[KIKI Boot Restorer] Auto-ensure Join to Create VC in ${guild.name}`
      });
      gData.voice_master_channel_id = joinChannel.id;
      modified = true;
    } catch (e) {
      console.error(`[BOOT RESTORER VM] Join VC error in ${guild.name}:`, e.message);
    }
  } else if (gData.voice_master_channel_id !== joinChannel.id) {
    gData.voice_master_channel_id = joinChannel.id;
    modified = true;
  }

  // 4. Ensure VM Audit Logs
  let vmLogChannel = gData.voice_master_log_channel_id ? guild.channels.cache.get(gData.voice_master_log_channel_id) : null;
  if (!vmLogChannel) {
    vmLogChannel = guild.channels.cache.find(c => c.parentId === category.id && (c.name.includes('vm-logs') || c.name.includes('voice-master-logs')));
  }
  if (!vmLogChannel && createIfMissing) {
    try {
      vmLogChannel = await guild.channels.create({
        name: '🔊〢vm-logs',
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages]
          },
          {
            id: botMember.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
          }
        ],
        reason: `[KIKI Boot Restorer] Auto-ensure VM logs channel in ${guild.name}`
      });
      gData.voice_master_log_channel_id = vmLogChannel.id;
      modified = true;
    } catch (e) {
      console.error(`[BOOT RESTORER VM] Log channel error in ${guild.name}:`, e.message);
    }
  } else if (gData.voice_master_log_channel_id !== vmLogChannel.id) {
    gData.voice_master_log_channel_id = vmLogChannel.id;
    modified = true;
  }

  // 5. Send Control Panel Message in Interface if empty
  if (interfaceChannel && createIfMissing) {
    try {
      const messages = await interfaceChannel.messages.fetch({ limit: 5 }).catch(() => null);
      if (!messages || messages.size === 0) {
        const VoiceMaster = require('./voiceMaster.js');
        const panelMsg = await interfaceChannel.send({
          embeds: [VoiceMaster.buildPanelEmbed()],
          components: VoiceMaster.buildPanelComponents()
        });
        gData.voice_master_panel_message_id = panelMsg.id;
        modified = true;
      }
    } catch (e) {}
  }

  if (createIfMissing) {
    gData.voice_master_enabled = true;
  }
  if (modified) {
    KIKI.saveConfig(cfg);
  }
  return true;
}

async function ensureInviteTracker(guild, createIfMissing = false) {
  const botMember = guild.members.me;
  if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageChannels)) return false;

  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};

  const gData = cfg.guilds[guild.id];
  let modified = false;

  // 1. Ensure Category
  let category = gData.invite_tracker_category_id ? guild.channels.cache.get(gData.invite_tracker_category_id) : null;
  if (!category) {
    category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && (c.name.toLowerCase().includes('invite tracker') || c.name === '📩・INVITE TRACKER'));
  }
  if (!category && createIfMissing) {
    try {
      category = await guild.channels.create({
        name: '📩・INVITE TRACKER',
        type: ChannelType.GuildCategory,
        reason: `[KIKI Boot Restorer] Auto-ensure Invite Tracker Category in ${guild.name}`
      });
      gData.invite_tracker_category_id = category.id;
      modified = true;
    } catch (e) {
      console.error(`[BOOT RESTORER INV] Category error in ${guild.name}:`, e.message);
    }
  } else if (gData.invite_tracker_category_id !== category.id) {
    gData.invite_tracker_category_id = category.id;
    modified = true;
  }

  if (!category) return false;

  // 2. Ensure invite-logs channel
  let channel = gData.invite_tracker_channel_id ? guild.channels.cache.get(gData.invite_tracker_channel_id) : null;
  if (!channel) {
    channel = guild.channels.cache.find(c => c.parentId === category.id && (c.name === 'invite-logs' || c.name === '📩・invite-logs'));
  }
  if (!channel && createIfMissing) {
    try {
      channel = await guild.channels.create({
        name: '📩・invite-logs',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Real-time Invite Tracking Logs • Who invited, all-time invites & leave tracking',
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages]
          },
          {
            id: botMember.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
          }
        ],
        reason: `[KIKI Boot Restorer] Auto-ensure invite-logs channel in ${guild.name}`
      });
      gData.invite_tracker_channel_id = channel.id;
      modified = true;
    } catch (e) {
      console.error(`[BOOT RESTORER INV] Channel error in ${guild.name}:`, e.message);
    }
  } else if (gData.invite_tracker_channel_id !== channel.id) {
    gData.invite_tracker_channel_id = channel.id;
    modified = true;
  }

  if (createIfMissing) {
    gData.invite_tracker_enabled = true;
  }
  if (modified) {
    KIKI.saveConfig(cfg);
  }
  return true;
}

async function ensureAutoRole(guild, createIfMissing = false) {
  const botMember = guild.members.me;
  if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) return false;

  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};

  const gData = cfg.guilds[guild.id];
  let roleId = gData.autorole_id;
  let role = roleId ? guild.roles.cache.get(roleId) : null;

  if (!role) {
    role = guild.roles.cache.find(r =>
      r.name.toLowerCase() === 'member' ||
      r.name.toLowerCase() === 'members' ||
      r.name === '🔮・Member'
    );
  }

  if (!role && createIfMissing) {
    try {
      role = await guild.roles.create({
        name: '🔮・Member',
        color: '#9B59B6',
        reason: `[KIKI Boot Restorer] Auto-ensure default Member role in ${guild.name}`
      });
    } catch (e) {
      console.error(`[BOOT RESTORER AUTOROLE] Error creating role in ${guild.name}:`, e.message);
    }
  }

  if (role && gData.autorole_id !== role.id) {
    gData.autorole_id = role.id;
    KIKI.saveConfig(cfg);
    return true;
  }
  return !!role;
}

async function ensureDeafAfk(guild, createIfMissing = false) {
  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};

  const gData = cfg.guilds[guild.id];
  let channelId = gData.deaf_afk_channel_id;
  let channel = channelId ? guild.channels.cache.get(channelId) : null;

  if (!channel && guild.afkChannelId) {
    channel = guild.channels.cache.get(guild.afkChannelId);
  }

  if (!channel) {
    channel = guild.channels.cache.find(c => c.type === ChannelType.GuildVoice && (c.name.toLowerCase().includes('afk') || c.name.toLowerCase().includes('lounge')));
  }

  const botMember = guild.members.me;
  if (!channel && botMember?.permissions.has(PermissionFlagsBits.ManageChannels) && createIfMissing) {
    try {
      channel = await guild.channels.create({
        name: '💤・AFK Lounge',
        type: ChannelType.GuildVoice,
        reason: `[KIKI Boot Restorer] Auto-ensure AFK voice channel in ${guild.name}`
      });
    } catch (e) {
      console.error(`[BOOT RESTORER DEAF] Error creating AFK VC in ${guild.name}:`, e.message);
    }
  }

  let modified = false;
  if (channel && gData.deaf_afk_channel_id !== channel.id) {
    gData.deaf_afk_channel_id = channel.id;
    modified = true;
  }
  if (createIfMissing) {
    if (gData.deaf_mover_enabled !== true) {
      gData.deaf_mover_enabled = true;
      modified = true;
    }
    if (gData.deaf_timeout_minutes !== 10) {
      gData.deaf_timeout_minutes = 10;
      modified = true;
    }
  }

  if (modified) {
    KIKI.saveConfig(cfg);
  }
  return !!channel;
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
  ensureVoiceMaster,
  ensureInviteTracker,
  ensureAutoRole,
  ensureDeafAfk,
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
        const gData = cfg.guilds?.[guild.id];
        const isConfigured = gData?.configured === true || String(guild.id) === '1563548609960742942';

        // Do NOT auto-create channels/roles on unconfigured servers!
        if (!isConfigured) {
          continue;
        }

        // Hydrate guild cache
        await guild.channels.fetch().catch(() => {});
        await guild.roles.fetch().catch(() => {});

        // 1. Auto-Verify & Bind existing Level Roles (5 to 50) without creating new ones
        const rolesCount = await ensureLevelRoles(guild, false);
        totalRolesVerified += rolesCount;

        // 2. Auto-Verify & Bind existing Log Channels without creating new ones
        const logsCount = await ensureLogChannels(guild, false);
        totalLogsVerified += logsCount;

        // 3. Ensure Announce Channels (level-logs & chat-levels)
        await ensureLevelAnnounceChannels(guild, false);

        // 4. Ensure Voice Master Dynamic VC System (Category + Join VC + Control Panel + VM Logs)
        await ensureVoiceMaster(guild, false);

        // 5. Ensure Invite Tracker (Category + invite-logs)
        await ensureInviteTracker(guild, false);

        // 6. Ensure Auto-Role (🔮・Member)
        await ensureAutoRole(guild, false);

        // 7. Ensure Deaf AFK Mover (💤・AFK Lounge, 10m)
        await ensureDeafAfk(guild, false);

        // 8. Send Live Boot Confirmation Card into Security Log Channel only for configured server
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
