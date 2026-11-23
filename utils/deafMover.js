// KIKI Bot - Deaf AFK Voice Mover Engine
// Automatically moves members who have been deafened in VC for 10+ minutes to configured AFK VC

const { PermissionFlagsBits, ChannelType } = require('discord.js');
const chalk = require('chalk');
const KIKI = require('./kiki.js');
const KikiEmbed = require('./embed.js');
const config = require('../config.js');

// Map to track when members became deaf: Map<userId, timestamp>
const deafTimestamps = new Map();
let tickerInterval = null;

const DeafMover = {
  // Return count of currently tracked deaf users
  getTrackedCount() {
    return deafTimestamps.size;
  },

  getDeafDuration(userId) {
    const started = deafTimestamps.get(userId);
    return started ? Date.now() - started : 0;
  },

  // Called on voiceStateUpdate
  onVoiceStateUpdate(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user?.bot) return;

    const isNowDeaf = newState.channelId && (newState.deaf || newState.selfDeaf);
    const wasDeaf = oldState.channelId && (oldState.deaf || oldState.selfDeaf);

    // If user left voice channel completely
    if (!newState.channelId) {
      deafTimestamps.delete(member.id);
      return;
    }

    // If user just became deaf
    if (isNowDeaf && !wasDeaf) {
      deafTimestamps.set(member.id, Date.now());
    } else if (!isNowDeaf && wasDeaf) {
      // If user un-deafened
      deafTimestamps.delete(member.id);
    } else if (isNowDeaf && !deafTimestamps.has(member.id)) {
      // Safety: user is deaf in VC but not tracked yet
      deafTimestamps.set(member.id, Date.now());
    }
  },

  // Check all voice states and move members who exceeded threshold (Multi-Server Isolated)
  async checkAndMove(client, guildFilter = null) {
    const cfg = KIKI.loadConfig();
    let movedCount = 0;
    let checkedCount = 0;

    const guilds = guildFilter ? [guildFilter] : Array.from(client.guilds.cache.values());

    for (const guild of guilds) {
      if (!guild.available) continue;

      const gData = cfg.guilds?.[guild.id] || {};
      const isEnabled = gData.deaf_mover_enabled ?? (cfg.deaf_mover_enabled !== false);
      if (!isEnabled) continue;

      const targetChannelId = gData.deaf_afk_channel_id || (guild.channels.cache.has(cfg.deaf_afk_channel_id) ? cfg.deaf_afk_channel_id : guild.afkChannelId);
      if (!targetChannelId) continue;

      const timeoutMinutes = Number(gData.deaf_timeout_minutes || cfg.deaf_timeout_minutes) || 10;
      const thresholdMs = timeoutMinutes * 60 * 1000;

      const botMember = guild.members.me;
      if (!botMember || !botMember.permissions.has(PermissionFlagsBits.MoveMembers)) {
        continue;
      }

      const targetVc = guild.channels.cache.get(targetChannelId) ||
        await guild.channels.fetch(targetChannelId).catch(() => null);

      if (!targetVc || targetVc.type !== ChannelType.GuildVoice) {
        continue;
      }

      for (const state of guild.voiceStates.cache.values()) {
        checkedCount++;

        // Must be in a voice channel
        if (!state.channelId) continue;

        // If already in target AFK VC, skip and clean tracking
        if (state.channelId === targetChannelId) {
          deafTimestamps.delete(state.id);
          continue;
        }

        const isDeaf = state.deaf || state.selfDeaf;
        if (!isDeaf) {
          deafTimestamps.delete(state.id);
          continue;
        }

        // If deaf, track start time if not already tracked
        if (!deafTimestamps.has(state.id)) {
          deafTimestamps.set(state.id, Date.now());
        }

        const deafDurationMs = Date.now() - deafTimestamps.get(state.id);
        if (deafDurationMs >= thresholdMs) {
          const member = state.member || await guild.members.fetch(state.id).catch(() => null);
          if (!member || member.user.bot) continue;

          const oldVc = guild.channels.cache.get(state.channelId);
          const oldVcName = oldVc?.name || 'Voice Channel';
          const durationMins = Math.floor(deafDurationMs / 60000);

          try {
            await member.voice.setChannel(
              targetVc.id,
              `[KIKI Deaf Mover] Inactive/Deaf in VC for ${durationMins}m`
            );

            movedCount++;
            deafTimestamps.delete(state.id);

            console.log(chalk.yellow(
              `  💤 [DEAF MOVER] Moved ${member.user.tag} from #${oldVcName} to #${targetVc.name} (Deaf for ${durationMins}m)`
            ));

            // Log event to voice log channel or security logs
            const logChannelId = cfg.voice_log_channel_id || cfg.security_log_channel_id || cfg.log_channel_id;
            if (logChannelId) {
              const logCh = guild.channels.cache.get(logChannelId) ||
                await guild.channels.fetch(logChannelId).catch(() => null);

              if (logCh && logCh.isTextBased()) {
                const alertEmbed = KikiEmbed.build({
                  title: '💤 Member Moved to AFK Voice Channel',
                  description:
                    `${member.user.toString()} (\`${member.user.tag}\`) ko auto-move kar diya gaya hai kyunki wo **10 minute se zyada deafened** baitha tha.\n\n` +
                    `• 📤 **Purana VC:** \`#${oldVcName}\`\n` +
                    `• 📥 **Naya AFK VC:** ${targetVc.toString()} (\`${targetVc.name}\`)\n` +
                    `• ⏱️ **Deafened Time:** \`${durationMins} minutes\``,
                  color: config.COLORS.GOLD || 0xF1C40F,
                  thumbnail: member.user.displayAvatarURL({ dynamic: true }),
                  footer: { text: `Deaf AFK Mover Engine • KIKI v${config.BOT_VERSION}` }
                });

                await logCh.send({ embeds: [alertEmbed] }).catch(() => {});
              }
            }
          } catch (err) {
            console.error(`[DEAF MOVER ERROR] Could not move ${member.user.tag}:`, err.message);
          }
        }
      }
    }

    return { moved: movedCount, checked: checkedCount };
  },

  // Start background ticker (scans every 30 seconds)
  init(client) {
    if (tickerInterval) return;
    console.log('[DEAF MOVER] Initializing AFK Voice Mover Ticker (30s interval)...');

    // Run first check after 10s
    setTimeout(() => {
      this.checkAndMove(client).catch(() => {});
    }, 10000);

    tickerInterval = setInterval(() => {
      this.checkAndMove(client).catch(() => {});
    }, 30000); // scans every 30 seconds
  }
};

module.exports = DeafMover;
