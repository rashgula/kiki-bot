// KIKI Bot - Voice State Update Event (Comprehensive Voice Logs & VC Integrations)
const { ChannelType } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');
const config = require('../config.js');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    // 1. Deaf AFK Mover Handler
    try {
      const DeafMover = require('../utils/deafMover.js');
      DeafMover.onVoiceStateUpdate(oldState, newState);
    } catch (e) {
      console.error('[DEAF MOVER ERROR]', e.message);
    }

    // 2. Voice Master Temporary Channels Handler
    try {
      const VoiceMaster = require('../utils/voiceMaster.js');
      await VoiceMaster.handleVoiceStateUpdate(oldState, newState);
    } catch (e) {
      console.error('[VOICE MASTER ERROR]', e.message);
    }

    // Resolve member with fetch fallback
    let member = newState.member || oldState.member;
    const userId = newState.id || oldState.id;
    if (!member && userId) {
      member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
    }
    if (!member || member.user?.bot) return;

    // 3. Voice Security & Activity Logs
    const logChannel = KIKI.getGuildChannel(guild, 'voice_log_channel_id');
    if (!logChannel || !logChannel.isTextBased()) return;

    try {
      const userTag = member.user?.tag || member.user?.username || 'Unknown User';
      const userAvatar = member.user?.displayAvatarURL?.({ dynamic: true }) || null;
      const memberMention = member.user?.toString() || `<@${member.id}>`;

      // Helper to send log embed
      const sendVoiceLog = async (embed) => {
        try {
          await logChannel.send({ embeds: [embed] });
        } catch (err) {
          console.error('[VOICE LOG SEND ERROR]', err.message);
        }
      };

      // ── A. USER JOINED VOICE CHANNEL ──
      if (!oldState.channelId && newState.channelId) {
        const channelName = newState.channel?.name || 'Voice Channel';
        const memberCount = newState.channel?.members?.size || 1;

        const embed = KikiEmbed.build({
          title: '🔊 Voice Channel Joined',
          description: `${memberMention} (\`${userTag}\`) joined voice channel.`,
          color: config.COLORS.GREEN || 0x2ECC71,
          thumbnail: userAvatar,
          fields: [
            { name: '👤 Member', value: `${userTag} (\`${member.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `<#${newState.channelId}> (\`${channelName}\`)`, inline: true },
            { name: '👥 In VC', value: `${memberCount} members`, inline: true }
          ]
        });
        return await sendVoiceLog(embed);
      }

      // ── B. USER LEFT VOICE CHANNEL ──
      if (oldState.channelId && !newState.channelId) {
        const channelName = oldState.channel?.name || 'Voice Channel';

        const embed = KikiEmbed.build({
          title: '🔇 Voice Channel Left',
          description: `${memberMention} (\`${userTag}\`) disconnected from voice channel.`,
          color: config.COLORS.RED || 0xE74C3C,
          thumbnail: userAvatar,
          fields: [
            { name: '👤 Member', value: `${userTag} (\`${member.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `\`#${channelName}\``, inline: true }
          ]
        });
        return await sendVoiceLog(embed);
      }

      // ── C. USER SWITCHED / MOVED VOICE CHANNEL ──
      if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const oldChannelName = oldState.channel?.name || 'Voice Channel';
        const newChannelName = newState.channel?.name || 'Voice Channel';

        const embed = KikiEmbed.build({
          title: '🔄 Voice Channel Switched',
          description: `${memberMention} (\`${userTag}\`) moved to another voice channel.`,
          color: config.COLORS.TEAL || 0x1ABC9C,
          thumbnail: userAvatar,
          fields: [
            { name: '👤 Member', value: `${userTag} (\`${member.id}\`)`, inline: true },
            { name: '📤 Old Channel', value: `\`#${oldChannelName}\``, inline: true },
            { name: '📥 New Channel', value: `<#${newState.channelId}> (\`${newChannelName}\`)`, inline: true }
          ]
        });
        return await sendVoiceLog(embed);
      }

      // ── D. MICROPHONE MUTE / UNMUTE (SELF MUTE) ──
      if (oldState.channelId && oldState.selfMute !== newState.selfMute) {
        const isMuted = newState.selfMute;
        const currentCh = newState.channelId || oldState.channelId;

        const embed = KikiEmbed.build({
          title: isMuted ? '🎙️ Microphone Muted' : '🎙️ Microphone Unmuted',
          description: `${memberMention} ${isMuted ? 'muted' : 'unmuted'} their microphone in <#${currentCh}>.`,
          color: isMuted ? 0xE67E22 : config.COLORS.GREEN,
          thumbnail: userAvatar,
          fields: [
            { name: '👤 Member', value: `${userTag} (\`${member.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `<#${currentCh}>`, inline: true }
          ]
        });
        return await sendVoiceLog(embed);
      }

      // ── E. HEADPHONES DEAFEN / UNDEAFEN (SELF DEAFEN) ──
      if (oldState.channelId && oldState.selfDeaf !== newState.selfDeaf) {
        const isDeaf = newState.selfDeaf;
        const currentCh = newState.channelId || oldState.channelId;

        const embed = KikiEmbed.build({
          title: isDeaf ? '🎧 Audio Deafened' : '🎧 Audio Undeafened',
          description: `${memberMention} ${isDeaf ? 'deafened' : 'undeafened'} their audio in <#${currentCh}>.`,
          color: isDeaf ? 0xE74C3C : config.COLORS.GREEN,
          thumbnail: userAvatar,
          fields: [
            { name: '👤 Member', value: `${userTag} (\`${member.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `<#${currentCh}>`, inline: true }
          ]
        });
        return await sendVoiceLog(embed);
      }

      // ── F. SERVER MUTE / UNMUTE (ADMIN ACTION) ──
      if (oldState.channelId && oldState.serverMute !== newState.serverMute) {
        const isMuted = newState.serverMute;
        const currentCh = newState.channelId || oldState.channelId;

        const embed = KikiEmbed.build({
          title: isMuted ? '🔇 Member Server-Muted' : '🔊 Member Server-Unmuted',
          description: `${memberMention} was ${isMuted ? '**server-muted**' : '**server-unmuted**'} in <#${currentCh}>.`,
          color: isMuted ? config.COLORS.GOLD : config.COLORS.GREEN,
          thumbnail: userAvatar,
          fields: [
            { name: '👤 Member', value: `${userTag} (\`${member.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `<#${currentCh}>`, inline: true }
          ]
        });
        return await sendVoiceLog(embed);
      }

      // ── G. SERVER DEAFEN / UNDEAFEN (ADMIN ACTION) ──
      if (oldState.channelId && oldState.serverDeaf !== newState.serverDeaf) {
        const isDeaf = newState.serverDeaf;
        const currentCh = newState.channelId || oldState.channelId;

        const embed = KikiEmbed.build({
          title: isDeaf ? '🔕 Member Server-Deafened' : '🔔 Member Server-Undeafened',
          description: `${memberMention} was ${isDeaf ? '**server-deafened**' : '**server-undeafened**'} in <#${currentCh}>.`,
          color: isDeaf ? config.COLORS.GOLD : config.COLORS.GREEN,
          thumbnail: userAvatar,
          fields: [
            { name: '👤 Member', value: `${userTag} (\`${member.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `<#${currentCh}>`, inline: true }
          ]
        });
        return await sendVoiceLog(embed);
      }

      // ── H. LIVE STREAMING (SCREEN SHARE) ──
      if (oldState.channelId && oldState.streaming !== newState.streaming) {
        const isStreaming = newState.streaming;
        const currentCh = newState.channelId || oldState.channelId;

        const embed = KikiEmbed.build({
          title: isStreaming ? '📺 Screen Share Started' : '📺 Screen Share Ended',
          description: `${memberMention} ${isStreaming ? 'started streaming' : 'stopped streaming'} in <#${currentCh}>.`,
          color: config.COLORS.PRIMARY,
          thumbnail: userAvatar,
          fields: [
            { name: '👤 Member', value: `${userTag} (\`${member.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `<#${currentCh}>`, inline: true }
          ]
        });
        return await sendVoiceLog(embed);
      }

      // ── I. CAMERA VIDEO ──
      if (oldState.channelId && oldState.selfVideo !== newState.selfVideo) {
        const isVideoOn = newState.selfVideo;
        const currentCh = newState.channelId || oldState.channelId;

        const embed = KikiEmbed.build({
          title: isVideoOn ? '📹 Camera Video Turned ON' : '📹 Camera Video Turned OFF',
          description: `${memberMention} turned ${isVideoOn ? 'ON' : 'OFF'} camera in <#${currentCh}>.`,
          color: config.COLORS.PRIMARY,
          thumbnail: userAvatar,
          fields: [
            { name: '👤 Member', value: `${userTag} (\`${member.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `<#${currentCh}>`, inline: true }
          ]
        });
        return await sendVoiceLog(embed);
      }
    } catch (err) {
      console.error('[VOICE LOG ERROR]', err.message);
    }
  }
};
