// KIKI Bot - Voice Master Engine (Custom Temporary Voice Channels)
// Comprehensive VoiceMaster dynamic voice channel system with interactive control panel

const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const KikiEmbed = require('./embed.js');
const KIKI = require('./kiki.js');
const config = require('../config.js');

const TEMP_DATA_FILE = path.join(__dirname, '..', 'data', 'temp_channels.json');

// Map: channelId -> { ownerId, guildId, createdAt, isLocked, isHidden, limit, trusted: [] }
const tempChannels = new Map();

function loadTempData() {
  try {
    if (fs.existsSync(TEMP_DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(TEMP_DATA_FILE, 'utf8'));
      for (const [id, val] of Object.entries(data)) {
        tempChannels.set(id, val);
      }
    }
  } catch (err) {
    console.error('[VOICE MASTER] Error loading temp channels:', err.message);
  }
}

function saveTempData() {
  try {
    const obj = {};
    for (const [id, val] of tempChannels.entries()) {
      obj[id] = val;
    }
    fs.writeFileSync(TEMP_DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.error('[VOICE MASTER] Error saving temp channels:', err.message);
  }
}

// Initial load
loadTempData();

const VoiceMaster = {
  getTrackedCount() {
    return tempChannels.size;
  },

  isTempChannel(channelId) {
    return tempChannels.has(channelId);
  },

  getTempChannel(channelId) {
    return tempChannels.get(channelId) || null;
  },

  setTempChannel(channelId, data) {
    tempChannels.set(channelId, data);
    saveTempData();
  },

  removeTempChannel(channelId) {
    const deleted = tempChannels.delete(channelId);
    if (deleted) saveTempData();
    return deleted;
  },

  // ── Audit Logs Channel Helper ─────────────────────────────────
  async ensureLogChannel(guild) {
    const cfg = KIKI.loadConfig();
    let logChannelId = cfg.voice_master_log_channel_id;

    let logChannel = logChannelId ? guild.channels.cache.get(logChannelId) : null;
    if (!logChannel && logChannelId) {
      logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
    }

    if (!logChannel && cfg.voice_master_category_id) {
      const category = guild.channels.cache.get(cfg.voice_master_category_id) ||
        await guild.channels.fetch(cfg.voice_master_category_id).catch(() => null);

      if (category) {
        logChannel = guild.channels.cache.find(c => c.parentId === category.id && (c.name.includes('vm-logs') || c.name.includes('voice-master-logs')));

        if (!logChannel) {
          logChannel = await guild.channels.create({
            name: '🔊〢vm-logs',
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
              {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages]
              },
              {
                id: (guild.members.me?.id || guild.client.user.id),
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
              }
            ],
            reason: 'Voice Master: Dedicated audit logs channel'
          });
        }

        cfg.voice_master_log_channel_id = logChannel.id;
        KIKI.saveConfig(cfg);
      }
    }

    return logChannel;
  },

  async sendLog(guild, embed) {
    try {
      const logChannel = await this.ensureLogChannel(guild);
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    } catch (err) {
      console.error('[VOICE MASTER LOG ERROR]', err.message);
    }
  },

  // ── Build Aesthetic Control Panel ─────────────────────────────
  buildPanelEmbed() {
    return KikiEmbed.build({
      title: '🔊 KIKI • Voice Master Interface',
      description:
        `Welcome to the **Voice Master** control interface!\n` +
        `Use the buttons below to customize and control your temporary voice channel.\n\n` +
        `🔒 **Lock** — Prevent other members from joining\n` +
        `🔓 **Unlock** — Open channel for everyone to join\n` +
        `👻 **Hide** — Make your channel invisible to others\n` +
        `👁️ **Unhide** — Make your channel visible again\n` +
        `👑 **Claim** — Claim ownership if the owner left the VC\n` +
        `👥 **Limit** — Set member limit (0-99, 0 = unlimited)\n` +
        `✏️ **Rename** — Change your voice channel name\n` +
        `🚫 **Kick** — Disconnect a user from your channel\n` +
        `🤝 **Permit** — Allow a specific user to join (even if locked)\n` +
        `🗑️ **Delete** — Delete your voice channel immediately\n\n` +
        `*💡 Note: You must be inside your temporary voice channel to use these controls!*`,
      color: config.COLORS.PRIMARY || 0x9B59B6,
      footer: { text: `Voice Master System • KIKI v${config.BOT_VERSION}` }
    });
  },

  buildPanelComponents() {
    // Row 1: Visibility & Access
    const lockBtn = new ButtonBuilder()
      .setCustomId('vm_lock')
      .setLabel('Lock')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Secondary);

    const unlockBtn = new ButtonBuilder()
      .setCustomId('vm_unlock')
      .setLabel('Unlock')
      .setEmoji('🔓')
      .setStyle(ButtonStyle.Secondary);

    const hideBtn = new ButtonBuilder()
      .setCustomId('vm_hide')
      .setLabel('Hide')
      .setEmoji('👻')
      .setStyle(ButtonStyle.Secondary);

    const unhideBtn = new ButtonBuilder()
      .setCustomId('vm_unhide')
      .setLabel('Unhide')
      .setEmoji('👁️')
      .setStyle(ButtonStyle.Secondary);

    const claimBtn = new ButtonBuilder()
      .setCustomId('vm_claim')
      .setLabel('Claim')
      .setEmoji('👑')
      .setStyle(ButtonStyle.Primary);

    const row1 = new ActionRowBuilder().addComponents(lockBtn, unlockBtn, hideBtn, unhideBtn, claimBtn);

    // Row 2: Management & Modification
    const limitBtn = new ButtonBuilder()
      .setCustomId('vm_limit')
      .setLabel('Limit')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Secondary);

    const renameBtn = new ButtonBuilder()
      .setCustomId('vm_rename')
      .setLabel('Rename')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Secondary);

    const kickBtn = new ButtonBuilder()
      .setCustomId('vm_kick')
      .setLabel('Kick')
      .setEmoji('🚫')
      .setStyle(ButtonStyle.Danger);

    const permitBtn = new ButtonBuilder()
      .setCustomId('vm_permit')
      .setLabel('Permit')
      .setEmoji('🤝')
      .setStyle(ButtonStyle.Success);

    const deleteBtn = new ButtonBuilder()
      .setCustomId('vm_delete')
      .setLabel('Delete')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger);

    const row2 = new ActionRowBuilder().addComponents(limitBtn, renameBtn, kickBtn, permitBtn, deleteBtn);

    return [row1, row2];
  },

  // ── Lifecycle: Clean Dead Channels on Boot ─────────────────────
  async init(client) {
    loadTempData();
    console.log(chalk.magenta('[VOICE MASTER] Initializing Voice Master Engine...'));

    let cleaned = 0;
    for (const [channelId, info] of tempChannels.entries()) {
      try {
        const guild = client.guilds.cache.get(info.guildId);
        if (!guild) {
          tempChannels.delete(channelId);
          cleaned++;
          continue;
        }

        const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
        if (!channel) {
          tempChannels.delete(channelId);
          cleaned++;
        } else if (channel.members.size === 0) {
          await channel.delete('Voice Master: Auto-cleaned empty channel on startup').catch(() => {});
          tempChannels.delete(channelId);
          cleaned++;
        }
      } catch {
        tempChannels.delete(channelId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      saveTempData();
      console.log(chalk.yellow(`[VOICE MASTER] Cleaned up ${cleaned} orphaned temp voice channel(s).`));
    }
  },

  // ── Voice State Update Handler ────────────────────────────────
  async handleVoiceStateUpdate(oldState, newState) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const cfg = KIKI.loadConfig();
    const joinChannelId = cfg.voice_master_channel_id;
    const categoryId = cfg.voice_master_category_id;

    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    // ── 1. User Joined the "Join to Create" Channel ──────────────
    if (joinChannelId && newState.channelId === joinChannelId) {
      try {
        const category = categoryId ? guild.channels.cache.get(categoryId) : null;
        const channelName = `🔊・${member.displayName}'s Lounge`;

        // Create temporary voice channel
        const newVoiceChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: category ? category.id : null,
          permissionOverwrites: [
            {
              id: guild.id, // @everyone
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
            },
            {
              id: member.id, // Owner
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.DeafenMembers,
              ],
            },
            {
              id: (guild.members.me?.id || guild.client.user.id), // Bot
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
              ],
            }
          ],
          reason: `Voice Master: Created temporary channel for ${member.user.tag}`
        });

        // Track in temp channels map
        tempChannels.set(newVoiceChannel.id, {
          ownerId: member.id,
          guildId: guild.id,
          createdAt: Date.now(),
          isLocked: false,
          isHidden: false,
          limit: 0,
          trusted: []
        });
        saveTempData();

        // Move member to their new channel immediately
        await member.voice.setChannel(newVoiceChannel.id, 'Voice Master: Moved to temporary channel');

        console.log(chalk.cyan(`  🔊 [VOICE MASTER] Created temp VC #${newVoiceChannel.name} for ${member.user.tag}`));

        // ── Voice Master Log: Channel Created ───────────────────
        const createEmbed = KikiEmbed.build({
          title: '🔊 Temporary Voice Channel Created',
          description:
            `Ek naya custom temporary voice channel create kiya gaya hai!\n\n` +
            `• 👤 **Created By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• 🆔 **User ID:** \`${member.id}\`\n` +
            `• 🔊 **Voice Channel:** ${newVoiceChannel.toString()} (\`${newVoiceChannel.name}\`)\n` +
            `• 📁 **Category:** \`${category ? category.name : 'Voice Master'}\`\n` +
            `• ⏰ **Created At:** <t:${Math.floor(Date.now() / 1000)}:F> (<t:${Math.floor(Date.now() / 1000)}:R>)`,
          color: config.COLORS.GREEN || 0x2ECC71,
          thumbnail: member.user.displayAvatarURL({ dynamic: true }),
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        });
        await this.sendLog(guild, createEmbed);
      } catch (err) {
        console.error('[VOICE MASTER CREATE ERROR]', err);
      }
      return;
    }

    // ── 2. User Left a Voice Channel ─────────────────────────────
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const oldChannelId = oldState.channelId;
      if (tempChannels.has(oldChannelId)) {
        const oldChannel = oldState.channel || guild.channels.cache.get(oldChannelId);
        if (oldChannel) {
          // Check if channel is now empty
          if (oldChannel.members.size === 0) {
            try {
              const info = tempChannels.get(oldChannelId);
              const durationMs = info?.createdAt ? Date.now() - info.createdAt : 0;
              const durationSec = Math.floor(durationMs / 1000);
              const durationStr = KIKI.formatDuration(durationSec);

              tempChannels.delete(oldChannelId);
              saveTempData();
              const chName = oldChannel.name;
              await oldChannel.delete('Voice Master: Temporary channel became empty');
              console.log(chalk.gray(`  🗑️ [VOICE MASTER] Deleted empty temp VC #${chName}`));

              // ── Voice Master Log: Channel Deleted (Empty) ──────
              const delEmbed = KikiEmbed.build({
                title: '🗑️ Temporary Voice Channel Deleted',
                description:
                  `Temporary voice channel empty ho gaya aur use automatically delete kar diya gaya.\n\n` +
                  `• 🔊 **Channel:** \`#${chName}\`\n` +
                  `• 👤 **Original Creator/Owner:** ${info?.ownerId ? `<@${info.ownerId}> (\`${info.ownerId}\`)` : '`Unknown`'}\n` +
                  `• ⏱️ **Active Duration:** \`${durationStr || '0s'}\`\n` +
                  `• ℹ️ **Reason:** \`Channel became empty (all members left)\`\n` +
                  `• ⏰ **Deleted At:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                color: config.COLORS.RED || 0xE74C3C,
                footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
              });
              await this.sendLog(guild, delEmbed);
            } catch (err) {
              console.error('[VOICE MASTER DELETE ERROR]', err.message);
            }
          }
        }
      }
    }
  },

  // ── Interaction Handler (Buttons & Modals) ─────────────────────
  async handleInteraction(interaction, client) {
    const customId = interaction.customId;
    if (!customId || !customId.startsWith('vm_')) return;

    const member = interaction.member;
    const guild = interaction.guild;
    if (!guild || !member) return;

    // Check if member is in a voice channel
    const currentVc = member.voice?.channel;

    // ── Modals Handling ──────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      if (!currentVc) {
        return interaction.reply({
          embeds: [KikiEmbed.error('Not in Voice', 'Aapko pehle apne temporary voice channel me hona hoga!')],
          ephemeral: true
        });
      }

      const tempInfo = tempChannels.get(currentVc.id);
      if (!tempInfo) {
        return interaction.reply({
          embeds: [KikiEmbed.error('Invalid Channel', 'Ye channel Voice Master ka temporary channel nahi hai!')],
          ephemeral: true
        });
      }

      if (tempInfo.ownerId !== member.id) {
        return interaction.reply({
          embeds: [KikiEmbed.error('Owner Only', `Sirf channel owner (<@${tempInfo.ownerId}>) ye setting change kar sakta hai!`)],
          ephemeral: true
        });
      }

      // 1. Rename Modal Submit
      if (customId === 'vm_modal_rename') {
        const newName = interaction.fields.getTextInputValue('vm_input_rename').trim();
        if (!newName || newName.length < 1 || newName.length > 50) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Invalid Name', 'Channel name 1 se 50 characters ke beech hona chahiye!')],
            ephemeral: true
          });
        }

        try {
          const oldName = currentVc.name;
          await currentVc.setName(newName, `Voice Master: Renamed by ${member.user.tag}`);

          // Audit Log
          const renameEmbed = KikiEmbed.build({
            title: '✏️ Voice Channel Renamed',
            description:
              `Voice channel ka naam change kiya gaya hai.\n\n` +
              `• 👤 **Renamed By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
              `• 🔊 **Channel:** ${currentVc.toString()}\n` +
              `• 📝 **Old Name:** \`#${oldName}\`\n` +
              `• 🏷️ **New Name:** \`#${newName}\`\n` +
              `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
            color: config.COLORS.BLUE || 0x3498DB,
            footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
          });
          this.sendLog(guild, renameEmbed);

          return interaction.reply({
            embeds: [KikiEmbed.success('Channel Renamed', `Aapka voice channel successfully rename ho gaya:\n**\`${newName}\`**`)],
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Rename Failed', `Discord rate limit ya error: ${err.message}`)],
            ephemeral: true
          });
        }
      }

      // 2. Limit Modal Submit
      if (customId === 'vm_modal_limit') {
        const limitStr = interaction.fields.getTextInputValue('vm_input_limit').trim();
        const limitNum = parseInt(limitStr, 10);

        if (isNaN(limitNum) || limitNum < 0 || limitNum > 99) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Invalid Limit', 'User limit 0 se 99 ke beech koi number hona chahiye (0 = Unlimited)!')],
            ephemeral: true
          });
        }

        try {
          await currentVc.setUserLimit(limitNum, `Voice Master: Limit updated by ${member.user.tag}`);
          tempInfo.limit = limitNum;
          saveTempData();

          // Audit Log
          const limitEmbed = KikiEmbed.build({
            title: '👥 Channel Limit Updated',
            description:
              `Voice channel ki user limit update ki gayi hai.\n\n` +
              `• 👤 **Updated By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
              `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
              `• 🔢 **New Limit:** \`${limitNum === 0 ? 'Unlimited (0)' : `${limitNum} members`}\`\n` +
              `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
            color: config.COLORS.TEAL || 0x1ABC9C,
            footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
          });
          this.sendLog(guild, limitEmbed);

          return interaction.reply({
            embeds: [KikiEmbed.success('Limit Updated', `Aapke channel ki user limit **${limitNum === 0 ? 'Unlimited (0)' : `${limitNum} members`}** set ho gayi!`)],
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Limit Failed', `Error updating limit: ${err.message}`)],
            ephemeral: true
          });
        }
      }

      // 3. Kick Modal Submit
      if (customId === 'vm_modal_kick') {
        const query = interaction.fields.getTextInputValue('vm_input_kick').trim().toLowerCase();
        const targetMember = currentVc.members.find(m =>
          m.id === query.replace(/[<@!>]/g, '') ||
          m.user.username.toLowerCase() === query ||
          m.displayName.toLowerCase() === query
        );

        if (!targetMember) {
          return interaction.reply({
            embeds: [KikiEmbed.error('User Not Found', 'Wo user abhi aapke voice channel me connected nahi hai!')],
            ephemeral: true
          });
        }

        if (targetMember.id === member.id) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Invalid Action', 'Aap khud ko kick nahi kar sakte!')],
            ephemeral: true
          });
        }

        try {
          await targetMember.voice.disconnect(`Voice Master: Kicked by owner ${member.user.tag}`);

          // Audit Log
          const kickEmbed = KikiEmbed.build({
            title: '🚫 Member Kicked from Voice Channel',
            description:
              `Ek user ko temporary voice channel se disconnect kiya gaya.\n\n` +
              `• 👤 **Kicked By Owner:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
              `• 👢 **Target Member:** ${targetMember.user.toString()} (\`${targetMember.user.tag}\` • ID: \`${targetMember.id}\`)\n` +
              `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
              `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
            color: config.COLORS.GOLD || 0xE67E22,
            footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
          });
          this.sendLog(guild, kickEmbed);

          return interaction.reply({
            embeds: [KikiEmbed.success('User Disconnected', `**${targetMember.user.tag}** ko aapke voice channel se disconnect kar diya gaya!`)],
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Kick Failed', `User disconnect karne me error aaya: ${err.message}`)],
            ephemeral: true
          });
        }
      }

      // 4. Permit Modal Submit
      if (customId === 'vm_modal_permit') {
        const query = interaction.fields.getTextInputValue('vm_input_permit').trim().toLowerCase();
        const targetId = query.replace(/[<@!>]/g, '');

        let targetMember = guild.members.cache.get(targetId) ||
          guild.members.cache.find(m => m.user.username.toLowerCase() === query || m.displayName.toLowerCase() === query);

        if (!targetMember) {
          targetMember = await guild.members.fetch(targetId).catch(() => null);
        }

        if (!targetMember) {
          return interaction.reply({
            embeds: [KikiEmbed.error('User Not Found', 'Server me wo member nahi mila! Please valid User ID ya mention provide karein.')],
            ephemeral: true
          });
        }

        try {
          await currentVc.permissionOverwrites.edit(targetMember.id, {
            ViewChannel: true,
            Connect: true,
            Speak: true
          });

          if (!tempInfo.trusted) tempInfo.trusted = [];
          if (!tempInfo.trusted.includes(targetMember.id)) {
            tempInfo.trusted.push(targetMember.id);
            saveTempData();
          }

          // Audit Log
          const permitEmbed = KikiEmbed.build({
            title: '🤝 Member Permitted to Voice Channel',
            description:
              `Ek user ko locked channel me aane ki permission di gayi.\n\n` +
              `• 👤 **Permitted By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
              `• 🔓 **Permitted Member:** ${targetMember.user.toString()} (\`${targetMember.user.tag}\` • ID: \`${targetMember.id}\`)\n` +
              `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
              `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
            color: config.COLORS.GREEN || 0x2ECC71,
            footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
          });
          this.sendLog(guild, permitEmbed);

          return interaction.reply({
            embeds: [KikiEmbed.success('User Permitted 🤝', `**${targetMember.user.tag}** ko aapke channel me aane ki permission de di gayi hai (chahe channel locked ho)!`)],
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Permit Failed', `Permission update error: ${err.message}`)],
            ephemeral: true
          });
        }
      }
    }

    // ── Button Clicks Handling ───────────────────────────────────
    if (interaction.isButton()) {
      if (!currentVc) {
        return interaction.reply({
          embeds: [KikiEmbed.error('Not in Voice 🔇', 'Aapko pehle apne temporary voice channel me join hona hoga tabhi ye button kaam karega!')],
          ephemeral: true
        });
      }

      const tempInfo = tempChannels.get(currentVc.id);
      if (!tempInfo) {
        return interaction.reply({
          embeds: [KikiEmbed.error('Invalid Channel ⚠️', 'Ye channel Voice Master dwara banaya gaya temporary channel nahi hai!')],
          ephemeral: true
        });
      }

      const isOwner = tempInfo.ownerId === member.id;

      // ── Claim Button (Available to non-owners if owner left) ────
      if (customId === 'vm_claim') {
        const currentOwnerInVc = currentVc.members.has(tempInfo.ownerId);

        if (isOwner) {
          return interaction.reply({
            embeds: [KikiEmbed.warn('Already Owner 👑', 'Aap pehle se hi is voice channel ke owner hain!')],
            ephemeral: true
          });
        }

        if (currentOwnerInVc) {
          return interaction.reply({
            embeds: [KikiEmbed.warn('Owner Still Present ⚠️', `Channel owner (<@${tempInfo.ownerId}>) abhi bhi voice channel me maujood hai! Aap claim nahi kar sakte.`)],
            ephemeral: true
          });
        }

        // Transfer ownership
        const oldOwnerId = tempInfo.ownerId;
        tempInfo.ownerId = member.id;
        saveTempData();

        try {
          // Remove old owner special perms
          await currentVc.permissionOverwrites.delete(oldOwnerId).catch(() => {});
          // Add new owner perms
          await currentVc.permissionOverwrites.edit(member.id, {
            ViewChannel: true,
            Connect: true,
            Speak: true,
            ManageChannels: true,
            MoveMembers: true,
            MuteMembers: true,
            DeafenMembers: true,
          });
        } catch {}

        // Audit Log
        const claimEmbed = KikiEmbed.build({
          title: '👑 Voice Channel Ownership Claimed',
          description:
            `Voice channel ka naya owner claim kiya gaya hai!\n\n` +
            `• 👤 **Purana Owner:** <@${oldOwnerId}> (\`${oldOwnerId}\`)\n` +
            `• 👑 **Naya Owner:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
            `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: config.COLORS.GOLD || 0xF1C40F,
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        });
        this.sendLog(guild, claimEmbed);

        return interaction.reply({
          embeds: [KikiEmbed.success('Ownership Claimed 👑', `Aap ab is voice channel (${currentVc.toString()}) ke naye **Owner** ban gaye hain!`)],
          ephemeral: true
        });
      }

      // All remaining buttons require owner status!
      if (!isOwner) {
        return interaction.reply({
          embeds: [KikiEmbed.error('Owner Only 🔒', `Sirf is channel ke owner (<@${tempInfo.ownerId}>) ke paas ye controls use karne ka right hai!\n*(Agar owner VC chhod ke chala gaya hai, toh aap **👑 Claim** par click kar sakte hain).*`)],
          ephemeral: true
        });
      }

      // ── 1. Lock ────────────────────────────────────────────────
      if (customId === 'vm_lock') {
        try {
          await currentVc.permissionOverwrites.edit(guild.id, { Connect: false });
          // Ensure owner and trusted still have connect
          await currentVc.permissionOverwrites.edit(member.id, { Connect: true });
          tempInfo.isLocked = true;
          saveTempData();

          // Audit Log
          const lockEmbed = KikiEmbed.build({
            title: '🔒 Voice Channel Locked',
            description:
              `Voice channel ko lock kar diya gaya hai.\n\n` +
              `• 👤 **Action By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
              `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
              `• ℹ️ **Status:** \`Only permitted members can join\`\n` +
              `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
            color: config.COLORS.GOLD || 0xF1C40F,
            footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
          });
          this.sendLog(guild, lockEmbed);

          return interaction.reply({
            embeds: [KikiEmbed.success('Channel Locked 🔒', 'Aapka channel lock kar diya gaya hai! Ab koi naya user bina permission ke join nahi kar sakta.')],
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Lock Error', `Error locking channel: ${err.message}`)],
            ephemeral: true
          });
        }
      }

      // ── 2. Unlock ──────────────────────────────────────────────
      if (customId === 'vm_unlock') {
        try {
          await currentVc.permissionOverwrites.edit(guild.id, { Connect: null });
          tempInfo.isLocked = false;
          saveTempData();

          // Audit Log
          const unlockEmbed = KikiEmbed.build({
            title: '🔓 Voice Channel Unlocked',
            description:
              `Voice channel ko unlock kar diya gaya hai.\n\n` +
              `• 👤 **Action By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
              `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
              `• ℹ️ **Status:** \`Everyone can join\`\n` +
              `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
            color: config.COLORS.GREEN || 0x2ECC71,
            footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
          });
          this.sendLog(guild, unlockEmbed);

          return interaction.reply({
            embeds: [KikiEmbed.success('Channel Unlocked 🔓', 'Aapka channel unlock ho gaya hai! Sabhi log join kar sakte hain.')],
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Unlock Error', `Error unlocking channel: ${err.message}`)],
            ephemeral: true
          });
        }
      }

      // ── 3. Hide ────────────────────────────────────────────────
      if (customId === 'vm_hide') {
        try {
          await currentVc.permissionOverwrites.edit(guild.id, { ViewChannel: false });
          await currentVc.permissionOverwrites.edit(member.id, { ViewChannel: true });
          tempInfo.isHidden = true;
          saveTempData();

          // Audit Log
          const hideEmbed = KikiEmbed.build({
            title: '👻 Voice Channel Hidden',
            description:
              `Voice channel ko hide kar diya gaya hai.\n\n` +
              `• 👤 **Action By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
              `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
              `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
            color: config.COLORS.PRIMARY || 0x9B59B6,
            footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
          });
          this.sendLog(guild, hideEmbed);

          return interaction.reply({
            embeds: [KikiEmbed.success('Channel Hidden 👻', 'Aapka channel hide kar diya gaya hai! Ab ye baaki members ko nahi dikhega.')],
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Hide Error', `Error hiding channel: ${err.message}`)],
            ephemeral: true
          });
        }
      }

      // ── 4. Unhide ──────────────────────────────────────────────
      if (customId === 'vm_unhide') {
        try {
          await currentVc.permissionOverwrites.edit(guild.id, { ViewChannel: null });
          tempInfo.isHidden = false;
          saveTempData();

          // Audit Log
          const unhideEmbed = KikiEmbed.build({
            title: '👁️ Voice Channel Unhidden',
            description:
              `Voice channel ko unhide kar diya gaya hai.\n\n` +
              `• 👤 **Action By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
              `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
              `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
            color: config.COLORS.TEAL || 0x1ABC9C,
            footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
          });
          this.sendLog(guild, unhideEmbed);

          return interaction.reply({
            embeds: [KikiEmbed.success('Channel Unhidden 👁️', 'Aapka channel ab sabhi ko dikhai dega!')],
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Unhide Error', `Error unhiding channel: ${err.message}`)],
            ephemeral: true
          });
        }
      }

      // ── 5. Rename Modal Launcher ───────────────────────────────
      if (customId === 'vm_rename') {
        const modal = new ModalBuilder()
          .setCustomId('vm_modal_rename')
          .setTitle('✏️ Rename Voice Channel');

        const nameInput = new TextInputBuilder()
          .setCustomId('vm_input_rename')
          .setLabel('Naya Channel Name Dalein')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. 🎧・Vibe Lounge')
          .setValue(currentVc.name)
          .setRequired(true)
          .setMaxLength(50);

        modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
        return await interaction.showModal(modal);
      }

      // ── 6. Limit Modal Launcher ────────────────────────────────
      if (customId === 'vm_limit') {
        const modal = new ModalBuilder()
          .setCustomId('vm_modal_limit')
          .setTitle('👥 Set Channel User Limit');

        const limitInput = new TextInputBuilder()
          .setCustomId('vm_input_limit')
          .setLabel('User Limit (0 = Unlimited, Max = 99)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. 5')
          .setValue(currentVc.userLimit ? String(currentVc.userLimit) : '0')
          .setRequired(true)
          .setMaxLength(2);

        modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
        return await interaction.showModal(modal);
      }

      // ── 7. Kick Modal Launcher ─────────────────────────────────
      if (customId === 'vm_kick') {
        const modal = new ModalBuilder()
          .setCustomId('vm_modal_kick')
          .setTitle('🚫 Kick Member from Channel');

        const kickInput = new TextInputBuilder()
          .setCustomId('vm_input_kick')
          .setLabel('Member ka Username ya ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Member username ya User ID')
          .setRequired(true)
          .setMaxLength(32);

        modal.addComponents(new ActionRowBuilder().addComponents(kickInput));
        return await interaction.showModal(modal);
      }

      // ── 8. Permit Modal Launcher ───────────────────────────────
      if (customId === 'vm_permit') {
        const modal = new ModalBuilder()
          .setCustomId('vm_modal_permit')
          .setTitle('🤝 Permit Member to Join');

        const permitInput = new TextInputBuilder()
          .setCustomId('vm_input_permit')
          .setLabel('Member ka ID ya Mention dalein')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('User ID ya Username')
          .setRequired(true)
          .setMaxLength(32);

        modal.addComponents(new ActionRowBuilder().addComponents(permitInput));
        return await interaction.showModal(modal);
      }

      // ── 9. Delete ──────────────────────────────────────────────
      if (customId === 'vm_delete') {
        try {
          const info = tempChannels.get(currentVc.id);
          const durationMs = info?.createdAt ? Date.now() - info.createdAt : 0;
          const durationStr = KIKI.formatDuration(Math.floor(durationMs / 1000));
          const chName = currentVc.name;

          tempChannels.delete(currentVc.id);
          saveTempData();
          await currentVc.delete(`Voice Master: Deleted by owner ${member.user.tag}`);

          // Audit Log
          const delEmbed = KikiEmbed.build({
            title: '🗑️ Temporary Voice Channel Deleted',
            description:
              `Voice channel owner ne apna channel manually delete kar diya.\n\n` +
              `• 🔊 **Channel:** \`#${chName}\`\n` +
              `• 👤 **Deleted By Owner:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
              `• ⏱️ **Total Active Duration:** \`${durationStr || '0s'}\`\n` +
              `• ⏰ **Deleted At:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            color: config.COLORS.RED || 0xE74C3C,
            footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
          });
          this.sendLog(guild, delEmbed);

          return interaction.reply({
            embeds: [KikiEmbed.success('Channel Deleted 🗑️', 'Aapka temporary voice channel turant delete kar diya gaya!')],
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Delete Error', `Channel delete karne me error aaya: ${err.message}`)],
            ephemeral: true
          });
        }
      }
    }
  }
};

module.exports = VoiceMaster;
