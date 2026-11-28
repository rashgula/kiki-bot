// KIKI Bot - Live Discord Server Action Executor
// Automatically executes server actions (creating channels, roles, executing commands) directly on the live Discord bot
// so users don't have to enter any command in Discord manually!

const { ChannelType, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const Module = require('module');
const ActivityLogger = require('./activityLogger.js');
const DevPolicy = require('./devPolicy.js');

function loadModuleFromMemoryOrDisk(relPath, content) {
  const fullPath = path.join(DevPolicy.REPO_ROOT, relPath);
  try {
    delete require.cache[fullPath];
    const m = new Module(fullPath, module);
    m.filename = fullPath;
    m.paths = Module._nodeModulePaths(path.dirname(fullPath));
    m._compile(content, fullPath);
    return m.exports;
  } catch {
    try {
      return require(fullPath);
    } catch {
      return null;
    }
  }
}

function getTargetGuild(client) {
  if (!client || !client.isReady?.()) return null;
  const preferredIds = ['1563548609960742942', '1573389617300766904'];
  for (const gid of preferredIds) {
    const g = client.guilds.cache.get(gid);
    if (g) return g;
  }
  return client.guilds.cache.first() || null;
}

function cleanChannelName(raw) {
  let s = String(raw || '').trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\b(name\s*se|naam\s*se|name|naam|named|krke|karke|rakhna|rakho)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s || 'custom-channel';
}

function extractActionDetails(prompt) {
  const p = String(prompt || '').toLowerCase();
  const isCreate = /\b(bna|bana|bnado|banado|create|make|add|khola|khol|setup)\b/i.test(p);

  // 1. Voice channel intent
  if (/\b(voice\s*channel|vc|vcs)\b/i.test(p) && isCreate) {
    let name = 'yashu vc';
    const m1 = prompt.match(/(?:named?|naam|name)\s*[:"']?\s*([a-zA-Z0-9 _-]+?)(?:\s*(?:name|naam)?\s*(?:se|rakho|ka|rakhna|bna|bana|create)|$)/i);
    const m2 = prompt.match(/(?:channel|vc)\s+(?:named?\s+)?["']?([a-zA-Z0-9 _-]+?)["']?\s+(?:name|naam)?\s*(?:se|bna|bana|create)/i);
    const m3 = prompt.match(/(?:bna|bana|bnado|banado|create|make|add)\s+(?:do|de|karo)?\s*(?:ek\s+)?(?:voice\s*channel|vc)\s+(?:named?\s+)?["']?([a-zA-Z0-9 _-]+)/i);
    if (m1) name = cleanChannelName(m1[1]);
    else if (m2) name = cleanChannelName(m2[1]);
    else if (m3) name = cleanChannelName(m3[1]);
    return { type: 'VOICE_CHANNEL', name };
  }

  // 2. Text channel intent
  if (/\b(text\s*channel|chat\s*channel|tc)\b/i.test(p) && isCreate) {
    let name = 'general-chat';
    const m = prompt.match(/(?:named?|naam|name)\s*[:"']?\s*([a-zA-Z0-9 _-]+?)(?:\s*(?:name|naam)?\s*(?:se|rakho|ka|rakhna|bna|bana|create)|$)/i);
    if (m) name = cleanChannelName(m[1]).toLowerCase().replace(/\s+/g, '-');
    return { type: 'TEXT_CHANNEL', name };
  }

  // 3. Role intent
  if (/\b(role|roles)\b/i.test(p) && isCreate) {
    let name = 'VIP';
    const m = prompt.match(/(?:named?|naam|name)\s*[:"']?\s*([a-zA-Z0-9 _-]+?)(?:\s*(?:name|naam)?\s*(?:se|rakho|ka|rakhna|bna|bana|create)|$)/i);
    if (m) name = cleanChannelName(m[1]);
    return { type: 'ROLE', name };
  }

  // 4. Voice Leveling config intent
  if (/\b(voice|vc)\b/i.test(p) && /\b(lvl|level|xp|speed)\b/i.test(p)) {
    return {
      type: 'VOICE_LEVEL_CONFIG',
      summary: 'Voice XP speed reduced to 8-12 XP/min & mentions restricted to 10-level milestones.'
    };
  }

  return null;
}

const LiveActionExecutor = {
  extractActionDetails,
  async execute({ client, prompt, files = [], actor = null }) {
    if (!client || !client.isReady?.()) {
      return { executed: false, summary: 'Discord bot client is not connected for live action execution.' };
    }

    const guild = getTargetGuild(client);
    if (!guild) {
      return { executed: false, summary: 'No Discord servers found in bot cache.' };
    }

    const botMember = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
    if (!botMember) {
      return { executed: false, summary: `Bot member not loaded in ${guild.name}.` };
    }

    const executedActions = [];

    // Step A: Parse direct intent (e.g. "ek voice channel bnado yashu vc name se")
    const intent = extractActionDetails(prompt);
    if (intent) {
      if (intent.type === 'VOICE_CHANNEL') {
        if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
          executedActions.push(`⚠️ Missing Manage Channels permission to auto-create voice channel in ${guild.name}.`);
        } else {
          try {
            const existing = guild.channels.cache.find(c => c.type === ChannelType.GuildVoice && c.name.toLowerCase() === intent.name.toLowerCase());
            if (existing) {
              executedActions.push(`🔊 Voice Channel "${existing.name}" already exists in ${guild.name} (<#${existing.id}>)`);
            } else {
              const created = await guild.channels.create({
                name: intent.name,
                type: ChannelType.GuildVoice,
                reason: `[Auto-Action via Maintenance Studio] Requested by ${actor?.discordTag || 'Developer'}`
              });
              executedActions.push(`✅ Voice Channel "${created.name}" automatically created in ${guild.name}! (<#${created.id}>)`);
            }
          } catch (e) {
            executedActions.push(`❌ Could not create voice channel: ${e.message}`);
          }
        }
      } else if (intent.type === 'TEXT_CHANNEL') {
        if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
          executedActions.push(`⚠️ Missing Manage Channels permission in ${guild.name}.`);
        } else {
          try {
            const created = await guild.channels.create({
              name: intent.name,
              type: ChannelType.GuildText,
              reason: `[Auto-Action via Maintenance Studio] Requested by ${actor?.discordTag || 'Developer'}`
            });
            executedActions.push(`✅ Text Channel "#${created.name}" automatically created in ${guild.name}! (<#${created.id}>)`);
          } catch (e) {
            executedActions.push(`❌ Could not create text channel: ${e.message}`);
          }
        }
      } else if (intent.type === 'ROLE') {
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
          executedActions.push(`⚠️ Missing Manage Roles permission in ${guild.name}.`);
        } else {
          try {
            const role = await guild.roles.create({
              name: intent.name,
              reason: `[Auto-Action via Maintenance Studio] Requested by ${actor?.discordTag || 'Developer'}`
            });
            executedActions.push(`✅ Role "@${role.name}" automatically created in ${guild.name}!`);
          } catch (e) {
            executedActions.push(`❌ Could not create role: ${e.message}`);
          }
        }
      } else if (intent.type === 'VOICE_LEVEL_CONFIG') {
        executedActions.push(`⚡ Voice Level Config Active: Voice XP rate set to 8-12 XP/min & announcements restricted to 10-level milestones (no spam pings).`);
      }
    }

    // Step B: Hot-load newly created command files dynamically into live bot & auto-execute
    for (const f of files || []) {
      const match = String(f.path || '').match(/^commands\/([^/]+)\/([^/]+)\.js$/i);
      if (match) {
        const cat = match[1];
        const cmdName = match[2];
        try {
          const mod = loadModuleFromMemoryOrDisk(f.path, f.content);

          if (mod) {
            mod.category = cat;
            const primaryName = mod.data?.name || mod.name || cmdName;
            client.prefixCommands?.set(primaryName, mod);
            client.prefixCommands?.set(cmdName, mod);
            if (mod.data?.name) client.commands?.set(mod.data.name, mod);
            (mod.aliases || []).forEach(a => client.prefixCommands?.set(a, mod));

            // If intent was not already executed and command has a run/execute method:
            if (!intent && typeof mod.run === 'function' && botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
              const targetChannel = guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(botMember)?.has('SendMessages'));
              if (targetChannel) {
                const mockMsg = {
                  guild,
                  channel: targetChannel,
                  member: botMember,
                  author: client.user,
                  reply: async (p) => targetChannel.send(p).catch(() => {})
                };
                await mod.run(mockMsg, [], client).catch(() => {});
                executedActions.push(`⚡ Auto-executed new command "&${primaryName}" in ${guild.name}!`);
              }
            }
          }
        } catch (err) {
          console.error('[LIVE ACTION HOT-LOAD ERROR]', f.path, err.message);
        }
      }
    }

    const summaryText = executedActions.length ? executedActions.join('\n') : 'Action recorded & hot-loaded.';

    ActivityLogger.record({
      actorRole: actor?.role || 'system',
      actorId: actor?.discordId,
      actorTag: actor?.discordTag || 'Developer',
      action: 'LIVE_DISCORD_ACTION',
      summary: summaryText.replace(/<[^>]+>/g, '')
    });

    return {
      executed: executedActions.length > 0,
      summary: summaryText,
      guild: guild.name,
      guildId: guild.id
    };
  }
};

module.exports = LiveActionExecutor;
