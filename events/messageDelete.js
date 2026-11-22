// KIKI Bot - Message Delete Event (Chat Logs)
const { ChannelType, AuditLogEvent } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');
const config = require('../config.js');
const MessageCache = require('../utils/messageCache.js');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    const guild = message.guild || (message.guildId ? client.guilds.cache.get(message.guildId) : null);
    if (!guild) return;

    // Check cached copy first
    const cached = MessageCache.get(message.id);

    // If message is bot, ignore
    if (message.author?.bot || cached?.authorTag?.toLowerCase() === 'kiki') return;

    const logChannel = KIKI.getGuildChannel(guild, 'chat_log_channel_id');
    if (!logChannel || !logChannel.isTextBased() || message.channelId === logChannel.id) return;

    try {

      const authorTag = message.author
        ? `${message.author.tag || message.author.username} (\`${message.author.id}\`)`
        : (cached?.authorTag ? `${cached.authorTag} (\`${cached.authorId}\`)` : 'Unknown User');

      const authorAvatar = message.author?.displayAvatarURL?.({ dynamic: true }) ||
        cached?.authorAvatar || null;

      let executorInfo = '';
      try {
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 1 });
        const entry = logs.entries.first();
        if (entry && Date.now() - entry.createdTimestamp < 8000) {
          if (entry.executor && entry.executor.id !== (message.author?.id || cached?.authorId)) {
            executorInfo = `${entry.executor.tag || entry.executor.username} (\`${entry.executor.id}\`)`;
          }
        }
      } catch {}

      const rawContent = message.content || cached?.content || '';
      const content = rawContent
        ? (rawContent.length > 1000 ? rawContent.slice(0, 1000) + '...' : rawContent)
        : '*[No text content or embedded media]*';

      const channelDisplay = message.channel
        ? message.channel.toString()
        : `<#${message.channelId}>`;

      const fields = [
        { name: '👤 Author', value: authorTag, inline: true },
        { name: '💬 Channel', value: channelDisplay, inline: true },
        { name: '📄 Deleted Content', value: content }
      ];

      if (executorInfo) {
        fields.push({ name: '🛡️ Deleted By (Staff/Mod)', value: executorInfo, inline: false });
      }

      const attachments = message.attachments?.size > 0
        ? message.attachments.map(a => a.url)
        : (cached?.attachments || []);

      if (attachments.length > 0) {
        fields.push({
          name: `📎 Attachments (${attachments.length})`,
          value: attachments.join('\n').slice(0, 1024)
        });
      }

      const embed = KikiEmbed.build({
        title: '🗑️ Message Deleted',
        description: `Ek message delete kiya gaya in ${channelDisplay}`,
        color: config.COLORS.RED || 0xE74C3C,
        thumbnail: authorAvatar,
        fields
      });

      await logChannel.send({ embeds: [embed] }).catch(err => {
        console.error('[CHAT LOG SEND ERROR]', err.message);
      });

      MessageCache.remove(message.id);
    } catch (err) {
      console.error('[CHAT LOG messageDelete]', err.message);
    }
  }
};
