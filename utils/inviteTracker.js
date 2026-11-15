// KIKI Bot - Invite Tracker Engine
// Tracks member invites, inviter stats (total, active, leaves, fakes, bonus),
// auto-creates category & logs channel, and sends real-time join/leave cards.

const { ChannelType, PermissionFlagsBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const KikiEmbed = require('./embed.js');
const KIKI = require('./kiki.js');
const config = require('../config.js');

const DB_PATH = path.join(__dirname, '../data/invites.json');

// In-memory invite caches:
// invitesCache: Map<guildId, Collection<code, { code, uses, inviterId, inviterTag, maxUses }>>
// vanityCache: Map<guildId, number>
const invitesCache = new Map();
const vanityCache = new Map();

function loadData() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { guilds: {} };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (err) {
    console.error(chalk.red('[INVITE TRACKER LOAD ERROR]'), err.message);
    return { guilds: {} };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(chalk.red('[INVITE TRACKER SAVE ERROR]'), err.message);
  }
}

function getGuildData(data, guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      settings: {
        categoryId: null,
        channelId: null,
        enabled: true
      },
      users: {},
      joinedMembers: {}
    };
  }
  return data.guilds[guildId];
}

const InviteTracker = {
  CATEGORY_NAME: '📩〢INVITE TRACKER',
  CHANNEL_NAME: '📩〢invite-logs',

  // Initialize and cache all invites on bot startup
  async init(client) {
    console.log(chalk.magenta('  📩 [INVITE TRACKER] Initializing invite cache for all servers...'));
    for (const [, guild] of client.guilds.cache) {
      await this.cacheGuildInvites(guild);
    }
    console.log(chalk.bold.green(`  ✅ [INVITE TRACKER] Cached invites for ${client.guilds.cache.size} server(s)!`));
  },

  // Cache invites for a single guild
  async cacheGuildInvites(guild) {
    if (!guild || !guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      // If lacking ManageGuild, can't fetch invites
      return;
    }

    try {
      const invites = await guild.invites.fetch().catch(() => null);
      if (invites) {
        const guildMap = new Collection();
        invites.forEach(inv => {
          guildMap.set(inv.code, {
            code: inv.code,
            uses: inv.uses || 0,
            inviterId: inv.inviter?.id || null,
            inviterTag: inv.inviter?.tag || 'Unknown',
            maxUses: inv.maxUses || 0,
            expiresAt: inv.expiresTimestamp || null
          });
        });
        invitesCache.set(guild.id, guildMap);
      }

      // Check Vanity URL if guild has feature
      if (guild.features.includes('VANITY_URL')) {
        const vanity = await guild.fetchVanityData().catch(() => null);
        if (vanity) {
          vanityCache.set(guild.id, vanity.uses || 0);
        }
      }
    } catch (err) {
      // Permissions or fetch error
    }
  },

  // When an invite is created
  handleInviteCreate(invite) {
    if (!invite || !invite.guild) return;
    let guildMap = invitesCache.get(invite.guild.id);
    if (!guildMap) {
      guildMap = new Collection();
      invitesCache.set(invite.guild.id, guildMap);
    }
    guildMap.set(invite.code, {
      code: invite.code,
      uses: invite.uses || 0,
      inviterId: invite.inviter?.id || null,
      inviterTag: invite.inviter?.tag || 'Unknown',
      maxUses: invite.maxUses || 0,
      expiresAt: invite.expiresTimestamp || null
    });
  },

  // When an invite is deleted
  handleInviteDelete(invite) {
    if (!invite || !invite.guild) return;
    const guildMap = invitesCache.get(invite.guild.id);
    if (guildMap) {
      guildMap.delete(invite.code);
    }
  },

  // Real-time Member Join handler
  async handleMemberAdd(member, client) {
    if (!member || !member.guild) return;
    const guild = member.guild;

    const data = loadData();
    const gData = getGuildData(data, guild.id);
    const cfg = KIKI.loadConfig();

    let inviterUser = null;
    let usedCode = 'Direct / Unknown';
    let isVanity = false;

    // Only attempt tracking if bot has ManageGuild permissions
    if (guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      try {
        const newInvites = await guild.invites.fetch().catch(() => null);
        const cached = invitesCache.get(guild.id);

        if (newInvites && cached) {
          // Look for an invite whose uses increased
          const usedInvite = newInvites.find(inv => {
            const oldInv = cached.get(inv.code);
            return oldInv && (inv.uses || 0) > (oldInv.uses || 0);
          });

          if (usedInvite) {
            usedCode = usedInvite.code;
            if (usedInvite.inviter) {
              inviterUser = usedInvite.inviter;
            } else if (usedInvite.inviterId) {
              inviterUser = await client.users.fetch(usedInvite.inviterId).catch(() => null);
            }
          }
        }

        // Check Vanity URL if not found and guild has vanity
        if (!inviterUser && guild.features.includes('VANITY_URL')) {
          const vanity = await guild.fetchVanityData().catch(() => null);
          const oldVanityUses = vanityCache.get(guild.id) || 0;
          if (vanity && vanity.uses > oldVanityUses) {
            isVanity = true;
            usedCode = vanity.code || 'Vanity URL';
            vanityCache.set(guild.id, vanity.uses);
          }
        }

        // Re-cache guild invites with new uses
        await this.cacheGuildInvites(guild);
      } catch (err) {
        console.error('[INVITE TRACKER MEMBER ADD ERROR]', err.message);
      }
    }

    // Determine if account is "fake" (created < 3 days ago)
    const isFake = (Date.now() - member.user.createdTimestamp) < (3 * 24 * 60 * 60 * 1000);

    // Update inviter stats if inviter is known
    let inviterStats = null;
    if (inviterUser && !inviterUser.bot) {
      if (!gData.users[inviterUser.id]) {
        gData.users[inviterUser.id] = {
          regular: 0,
          left: 0,
          fake: 0,
          bonus: 0,
          total: 0 // "aaj tak kitne invite kiye he"
        };
      }

      inviterStats = gData.users[inviterUser.id];
      inviterStats.total = (inviterStats.total || 0) + 1; // All-time total

      if (isFake) {
        inviterStats.fake = (inviterStats.fake || 0) + 1;
      } else {
        inviterStats.regular = (inviterStats.regular || 0) + 1;
      }

      gData.joinedMembers[member.id] = {
        inviterId: inviterUser.id,
        code: usedCode,
        joinedAt: Date.now(),
        isFake: isFake
      };

      saveData(data);
    } else {
      // Record unknown / vanity
      gData.joinedMembers[member.id] = {
        inviterId: null,
        code: usedCode,
        joinedAt: Date.now(),
        isFake: isFake,
        isVanity: isVanity
      };
      saveData(data);
    }

    // Determine target log channel
    const logChannelId = cfg.invite_tracker_channel_id || gData.settings?.channelId;
    let targetChannel = null;
    if (logChannelId) {
      targetChannel = guild.channels.cache.get(logChannelId) || await guild.channels.fetch(logChannelId).catch(() => null);
    }
    if (!targetChannel) {
      targetChannel = guild.channels.cache.find(c => c.name === this.CHANNEL_NAME && c.isTextBased());
    }

    if (targetChannel && targetChannel.isTextBased()) {
      const inviterDisplay = inviterUser ? `${inviterUser.toString()} (\`${inviterUser.tag}\`)` : (isVanity ? '🔗 **Server Vanity URL**' : '❓ **Direct / Unknown**');
      const totalInvites = inviterStats ? inviterStats.total : 0;
      const regularInvites = inviterStats ? inviterStats.regular : 0;
      const leftInvites = inviterStats ? inviterStats.left : 0;
      const fakeInvites = inviterStats ? inviterStats.fake : 0;

      const embed = KikiEmbed.build({
        title: '📥 Member Joined • Invite Log',
        description:
          `**New Member:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
          `**Invited By:** ${inviterDisplay}\n` +
          (inviterUser ? `**Inviter All-Time Total:** 👑 \`${totalInvites}\` invites *(Active: ${regularInvites} | Left: ${leftInvites} | Fake: ${fakeInvites})*\n` : '') +
          `**Invite Code:** \`${usedCode}\`\n` +
          `**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R> ${isFake ? '⚠️ *(Account < 3 days old)*' : '✅'}\n` +
          `**Member Count:** \`#${guild.memberCount}\``,
        color: config.COLORS.PURPLE || 0x9B59B6,
        thumbnail: member.user.displayAvatarURL({ dynamic: true }),
        footer: { text: `KIKI Invite Tracker • Code: ${usedCode}` },
        timestamp: true
      });

      await targetChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },

  // Real-time Member Leave handler
  async handleMemberRemove(member, client) {
    if (!member || !member.guild) return;
    const guild = member.guild;

    const data = loadData();
    const gData = getGuildData(data, guild.id);
    const cfg = KIKI.loadConfig();

    const record = gData.joinedMembers?.[member.id];
    let inviterUser = null;
    let inviterStats = null;

    if (record && record.inviterId) {
      inviterStats = gData.users[record.inviterId];
      if (inviterStats) {
        if (record.isFake) {
          inviterStats.fake = Math.max(0, (inviterStats.fake || 0) - 1);
        } else {
          inviterStats.regular = Math.max(0, (inviterStats.regular || 0) - 1);
        }
        inviterStats.left = (inviterStats.left || 0) + 1;
        saveData(data);
      }
      inviterUser = await client.users.fetch(record.inviterId).catch(() => null);
    }

    // Determine target log channel
    const logChannelId = cfg.invite_tracker_channel_id || gData.settings?.channelId;
    let targetChannel = null;
    if (logChannelId) {
      targetChannel = guild.channels.cache.get(logChannelId) || await guild.channels.fetch(logChannelId).catch(() => null);
    }
    if (!targetChannel) {
      targetChannel = guild.channels.cache.find(c => c.name === this.CHANNEL_NAME && c.isTextBased());
    }

    if (targetChannel && targetChannel.isTextBased()) {
      const inviterDisplay = inviterUser ? `${inviterUser.toString()} (\`${inviterUser.tag}\`)` : '❓ **Direct / Unknown**';
      const totalInvites = inviterStats ? inviterStats.total : 0;
      const regularInvites = inviterStats ? inviterStats.regular : 0;
      const leftInvites = inviterStats ? inviterStats.left : 0;

      const embed = KikiEmbed.build({
        title: '📤 Member Left • Invite Log',
        description:
          `**Member Left:** ${member.user?.toString() || member.id} (\`${member.user?.tag || member.id}\`)\n` +
          `**Was Invited By:** ${inviterDisplay}\n` +
          (inviterUser ? `**Inviter Current Stats:** 🟢 Active: \`${regularInvites}\` | 🚪 Left: \`${leftInvites}\` | 👑 All-Time: \`${totalInvites}\`\n` : '') +
          `**Remaining Members:** \`#${guild.memberCount}\``,
        color: config.COLORS.RED || 0xC0392B,
        thumbnail: member.user?.displayAvatarURL ? member.user.displayAvatarURL({ dynamic: true }) : null,
        footer: { text: `KIKI Invite Tracker` },
        timestamp: true
      });

      await targetChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },

  // 1-Click Setup: Creates Category and Channel, applies permissions, caches invites
  async setup(guild, client) {
    const botMember = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
    if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      throw new Error('Bot ke paas `Manage Channels` permission honi zaroori hai!');
    }

    // 1. Ensure Category
    let category = guild.channels.cache.find(
      c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('invite tracker')
    );

    if (!category) {
      category = await guild.channels.create({
        name: this.CATEGORY_NAME,
        type: ChannelType.GuildCategory,
        reason: '[KIKI] Automated Invite Tracker Category Setup'
      });
    }

    // 2. Ensure Text Channel in Category
    let channel = guild.channels.cache.find(
      c => c.type === ChannelType.GuildText && (c.name === this.CHANNEL_NAME || c.name === 'invite-logs')
    );

    if (!channel) {
      channel = await guild.channels.create({
        name: this.CHANNEL_NAME,
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Real-time Invite Tracking Logs • Who invited, all-time invites & leave tracking',
        permissionOverwrites: [
          {
            id: guild.id, // @everyone can view but cannot send messages
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages]
          },
          {
            id: botMember.id, // Bot has full control
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ManageMessages
            ]
          }
        ],
        reason: '[KIKI] Automated Invite Tracker Log Channel Setup'
      });
    } else if (channel.parentId !== category.id) {
      await channel.setParent(category.id).catch(() => {});
    }

    // 3. Save IDs in Config & Database
    const cfg = KIKI.loadConfig();
    cfg.invite_tracker_category_id = category.id;
    cfg.invite_tracker_channel_id = channel.id;
    cfg.invite_tracker_enabled = true;
    KIKI.saveConfig(cfg);

    const data = loadData();
    const gData = getGuildData(data, guild.id);
    gData.settings.categoryId = category.id;
    gData.settings.channelId = channel.id;
    gData.settings.enabled = true;
    saveData(data);

    // 4. Cache all existing server invites
    await this.cacheGuildInvites(guild);
    const cachedCount = invitesCache.get(guild.id)?.size || 0;

    // 5. Send announcement banner embed in #📩〢invite-logs
    const bannerEmbed = KikiEmbed.build({
      title: '📩〢KIKI Invite Tracker System Active',
      description:
        `**Server ke saare invites ab 24/7 real-time monitor ho rahe hain!**\n\n` +
        `✨ **Features Active:**\n` +
        `• 📥 **Join Tracking:** Jab koi member aayega, kisne invite kiya aur inviter ke **aaj tak total invites** yahan log honge.\n` +
        `• 📤 **Leave Tracking:** Member ke leave karne par inviter ke stats automatically update honge.\n` +
        `• 👑 **All-Time Stats:** Har user ka all-time total count permanently save rahega.\n` +
        `• ⚠️ **Fake / Alt Account Detection:** 3 din se chote naye accounts automatically detect honge.\n\n` +
        `**Helpful Commands:**\n` +
        `• \`&invites [@user]\` — Apne ya kisi user ke detailed invites check karein\n` +
        `• \`&invitetop\` — Server ke Top 10 Inviters ki leaderboard dekhein\n` +
        `• \`&invitetracker sync\` — Server invites ko Discord ke sath sync karein\n\n` +
        `> *Powered by KIKI Gothic Utility Engine • Zero Setup Needed on Reboot!*`,
      color: config.COLORS.PURPLE || 0x9B59B6,
      footer: { text: `Invite Tracker System • Cached: ${cachedCount} Invites` },
      timestamp: true
    });

    await channel.send({ embeds: [bannerEmbed] }).catch(() => {});

    return { category, channel, cachedCount };
  },

  // Get specific user stats
  getUserStats(guildId, userId) {
    const data = loadData();
    const gData = getGuildData(data, guildId);
    const u = gData.users[userId] || {
      regular: 0,
      left: 0,
      fake: 0,
      bonus: 0,
      total: 0
    };

    const regular = u.regular || 0;
    const left = u.left || 0;
    const fake = u.fake || 0;
    const bonus = u.bonus || 0;
    const total = u.total || (regular + left + fake);
    const effective = Math.max(0, regular + bonus);

    return {
      regular,
      left,
      fake,
      bonus,
      total,       // "aaj tak kitne invite kiye he"
      effective    // net valid invites currently
    };
  },

  // Get Server Invites Leaderboard
  getLeaderboard(guildId, limit = 10) {
    const data = loadData();
    const gData = getGuildData(data, guildId);
    const userEntries = Object.entries(gData.users || {});

    const sorted = userEntries.map(([userId, stats]) => {
      const regular = stats.regular || 0;
      const left = stats.left || 0;
      const fake = stats.fake || 0;
      const bonus = stats.bonus || 0;
      const total = stats.total || (regular + left + fake);
      const effective = Math.max(0, regular + bonus);
      return { userId, regular, left, fake, bonus, total, effective };
    }).sort((a, b) => b.total - a.total || b.effective - a.effective);

    return sorted.slice(0, limit);
  },

  // Add or remove bonus invites (Admin only)
  addBonus(guildId, userId, amount) {
    const data = loadData();
    const gData = getGuildData(data, guildId);
    if (!gData.users[userId]) {
      gData.users[userId] = { regular: 0, left: 0, fake: 0, bonus: 0, total: 0 };
    }
    gData.users[userId].bonus = (gData.users[userId].bonus || 0) + amount;
    gData.users[userId].total = Math.max(0, (gData.users[userId].total || 0) + (amount > 0 ? amount : 0));
    saveData(data);
    return this.getUserStats(guildId, userId);
  },

  // Reset user
  resetUser(guildId, userId) {
    const data = loadData();
    const gData = getGuildData(data, guildId);
    if (gData.users[userId]) {
      delete gData.users[userId];
      saveData(data);
      return true;
    }
    return false;
  }
};

module.exports = InviteTracker;
