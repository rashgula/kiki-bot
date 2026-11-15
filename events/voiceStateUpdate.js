// KIKI Bot - Voice State Update Event (Voice Logs)
const { ChannelType } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');
const config = require('../config.js');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    // Track Deaf AFK transitions in real time
    try {
      const DeafMover = require('../utils/deafMover.js');
      DeafMover.onVoiceStateUpdate(oldState, newState);
    } catch {}

    // Voice Master Temporary Channels Handler
    try {
      const VoiceMaster = require('../utils/voiceMaster.js');
      await VoiceMaster.handleVoiceStateUpdate(oldState, newState);
    } catch (e) {
      console.error('[VOICE MASTER ERROR]', e.message);
    }

    const cfg = KIKI.loadConfig();
    const logChannelId = cfg.voice_log_channel_id;
    if (!logChannelId) return;

    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    try {
      const logChannel = guild.channels.cache.get(logChannelId) || await guild.channels.fetch(logChannelId).catch(() => null);
      if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

      // 1. User Joined Voice Channel
      if (!oldState.channelId && newState.channelId) {
        const embed = KikiEmbed.build({
          title: '🔊 Voice Channel Joined',
          description: `${member.user.toString()} (\`${member.user.tag}\`) joined a voice channel.`,
          color: config.COLORS.GREEN || 0x2ECC71,
          thumbnail: member.user.displayAvatarURL({ dynamic: true }),
          fields: [
            { name: '👤 Member', value: `${member.user.tag} (\`${member.user.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `<#${newState.channelId}> (\`${newState.channel.name}\`)`, inline: true },
            { name: '👥 In VC', value: `${newState.channel.members.size} members`, inline: true }
          ]
        });
        return await logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      // 2. User Left Voice Channel
      if (oldState.channelId && !newState.channelId) {
        const embed = KikiEmbed.build({
          title: '🔇 Voice Channel Left',
          description: `${member.user.toString()} (\`${member.user.tag}\`) left voice channel.`,
          color: config.COLORS.RED || 0xE74C3C,
          thumbnail: member.user.displayAvatarURL({ dynamic: true }),
          fields: [
            { name: '👤 Member', value: `${member.user.tag} (\`${member.user.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `\`#${oldState.channel?.name || 'Voice Channel'}\``, inline: true }
          ]
        });
        return await logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      // 3. User Switched / Moved Voice Channel
      if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const embed = KikiEmbed.build({
          title: '🔄 Voice Channel Switched',
          description: `${member.user.toString()} (\`${member.user.tag}\`) moved to another voice channel.`,
          color: config.COLORS.TEAL || 0x1ABC9C,
          thumbnail: member.user.displayAvatarURL({ dynamic: true }),
          fields: [
            { name: '👤 Member', value: `${member.user.tag} (\`${member.user.id}\`)`, inline: true },
            { name: '📤 Old Channel', value: `\`#${oldState.channel?.name || 'Voice Channel'}\``, inline: true },
            { name: '📥 New Channel', value: `<#${newState.channelId}> (\`${newState.channel?.name || 'Voice Channel'}\`)`, inline: true }
          ]
        });
        return await logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      // 4. Server Mute Status Changed
      if (oldState.serverMute !== newState.serverMute) {
        const isMuted = newState.serverMute;
        const embed = KikiEmbed.build({
          title: isMuted ? '🔇 Member Server-Muted' : '🔊 Member Server-Unmuted',
          description: `${member.user.toString()} was ${isMuted ? 'server-muted' : 'unmuted'} in <#${newState.channelId}>.`,
          color: isMuted ? config.COLORS.GOLD : config.COLORS.GREEN,
          fields: [
            { name: '👤 Member', value: `${member.user.tag} (\`${member.user.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `<#${newState.channelId}>`, inline: true }
          ]
        });
        return await logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      // 5. Server Deafen Status Changed
      if (oldState.serverDeaf !== newState.serverDeaf) {
        const isDeaf = newState.serverDeaf;
        const embed = KikiEmbed.build({
          title: isDeaf ? '🔕 Member Server-Deafened' : '🔔 Member Server-Undeafened',
          description: `${member.user.toString()} was ${isDeaf ? 'server-deafened' : 'undeafened'} in <#${newState.channelId}>.`,
          color: isDeaf ? config.COLORS.GOLD : config.COLORS.GREEN,
          fields: [
            { name: '👤 Member', value: `${member.user.tag} (\`${member.user.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `<#${newState.channelId}>`, inline: true }
          ]
        });
        return await logChannel.send({ embeds: [embed] }).catch(() => {});
      }

      // 6. Live Streaming / Video Share
      if (!oldState.streaming && newState.streaming) {
        const embed = KikiEmbed.build({
          title: '📺 Member Started Streaming',
          description: `${member.user.toString()} started live streaming in <#${newState.channelId}>.`,
          color: config.COLORS.PRIMARY,
          fields: [
            { name: '👤 Member', value: `${member.user.tag} (\`${member.user.id}\`)`, inline: true },
            { name: '🔊 Channel', value: `<#${newState.channelId}>`, inline: true }
          ]
        });
        return await logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    } catch (err) {
      console.error('[VOICE LOG ERROR]', err.message);
    }
  }
};
