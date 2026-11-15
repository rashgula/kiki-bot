// KIKI Bot - Message Delete Event (Chat Logs)
const { ChannelType } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');
const config = require('../config.js');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild || message.author?.bot) return;

    const cfg = KIKI.loadConfig();
    const chatLogId = cfg.chat_log_channel_id;
    if (!chatLogId) return;

    // Do not log deletions inside the log channel itself
    if (message.channelId === chatLogId) return;

    try {
      const logChannel = message.guild.channels.cache.get(chatLogId) || await message.guild.channels.fetch(chatLogId).catch(() => null);
      if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

      const content = message.content
        ? (message.content.length > 1000 ? message.content.slice(0, 1000) + '...' : message.content)
        : '*[No text content or embedded message]*';

      const fields = [
        { name: '👤 Author', value: message.author ? `${message.author.tag} (\`${message.author.id}\`)` : 'Unknown User', inline: true },
        { name: '💬 Channel', value: `${message.channel.toString()} (\`#${message.channel.name}\`)`, inline: true },
        { name: '📄 Deleted Content', value: content }
      ];

      if (message.attachments && message.attachments.size > 0) {
        const attachUrls = message.attachments.map(a => a.url).join('\n');
        fields.push({
          name: `📎 Attachments (${message.attachments.size})`,
          value: attachUrls.slice(0, 1024)
        });
      }

      const embed = KikiEmbed.build({
        title: '🗑️ Message Deleted',
        description: `Ek message delete kiya gaya in ${message.channel.toString()}`,
        color: config.COLORS.RED || 0xE74C3C,
        thumbnail: message.author?.displayAvatarURL({ dynamic: true }) || null,
        fields
      });

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      console.error('[CHAT LOG messageDelete]', err.message);
    }
  }
};
