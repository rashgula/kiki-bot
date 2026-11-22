// KIKI Bot - Message Delete Event (Chat Logs)
// Fixed: message.author null check for Railway cache miss
const { ChannelType, AuditLogEvent } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');
const config = require('../config.js');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild) return;
    // On Railway, message may be partial (not cached) — allow partial messages through
    if (message.author?.bot) return;

    const cfg = KIKI.loadConfig();
    const chatLogId = cfg.chat_log_channel_id;
    if (!chatLogId) return;

    // Do not log deletions inside the log channel itself
    if (message.channelId === chatLogId) return;

    try {
      const logChannel = message.guild.channels.cache.get(chatLogId) ||
        await message.guild.channels.fetch(chatLogId).catch(() => null);
      if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

      // Fetch author from audit log if message is partial (not cached)
      let authorTag = message.author ? `${message.author.tag} (\`${message.author.id}\`)` : 'Unknown User';
      let authorAvatar = message.author?.displayAvatarURL({ dynamic: true }) || null;
      let executorInfo = '';

      // Try to get who deleted it from audit log
      try {
        const logs = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 1 });
        const entry = logs.entries.first();
        if (entry && Date.now() - entry.createdTimestamp < 5000) {
          if (entry.executor && entry.executor.id !== entry.target?.id) {
            executorInfo = `\n🛡️ **Deleted by:** ${entry.executor.tag} (\`${entry.executor.id}\`)`;
          }
        }
      } catch {}

      const content = message.content
        ? (message.content.length > 1000 ? message.content.slice(0, 1000) + '...' : message.content)
        : '*[No text content / message not cached]*';

      const fields = [
        { name: '👤 Author', value: authorTag, inline: true },
        { name: '💬 Channel', value: message.channel ? `${message.channel.toString()} (\`#${message.channel.name}\`)` : `\`${message.channelId}\``, inline: true },
        { name: '📄 Deleted Content', value: content }
      ];

      if (executorInfo) {
        fields.push({ name: '🔍 Deleted By', value: executorInfo.replace('\n🛡️ **Deleted by:** ', '') });
      }

      if (message.attachments && message.attachments.size > 0) {
        const attachUrls = message.attachments.map(a => a.url).join('\n');
        fields.push({
          name: `📎 Attachments (${message.attachments.size})`,
          value: attachUrls.slice(0, 1024)
        });
      }

      const embed = KikiEmbed.build({
        title: '🗑️ Message Deleted',
        description: `Ek message delete kiya gaya in ${message.channel?.toString() || `<#${message.channelId}>`}`,
        color: config.COLORS.RED || 0xE74C3C,
        thumbnail: authorAvatar,
        fields
      });

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      console.error('[CHAT LOG messageDelete]', err.message);
    }
  }
};
