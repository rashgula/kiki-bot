// KIKI Bot - Message Update Event (Chat Logs)
const { ChannelType } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');
const config = require('../config.js');
const MessageCache = require('../utils/messageCache.js');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    const guild = newMessage.guild || oldMessage.guild || (newMessage.guildId ? client.guilds.cache.get(newMessage.guildId) : null);
    if (!guild) return;

    // Fetch full message if partial
    if (newMessage.partial) {
      try {
        await newMessage.fetch();
      } catch {}
    }

    if (newMessage.author?.bot) return;

    // Retrieve cached previous content if oldMessage was uncached
    const cached = MessageCache.get(newMessage.id);
    const oldContent = oldMessage.content || cached?.content || '';
    const newContent = newMessage.content || '';

    // Ignore if content hasn't changed (e.g. embed preview generated)
    if (oldContent === newContent) return;
    if (!oldContent && !newContent) return;

    const logChannel = KIKI.getGuildChannel(guild, 'chat_log_channel_id');
    if (!logChannel || !logChannel.isTextBased() || newMessage.channelId === logChannel.id) return;

    try {

      const beforeDisplay = oldContent
        ? (oldContent.length > 500 ? oldContent.slice(0, 500) + '...' : oldContent)
        : '*[Previous content not cached]*';

      const afterDisplay = newContent
        ? (newContent.length > 500 ? newContent.slice(0, 500) + '...' : newContent)
        : '*[Empty]*';

      const authorTag = newMessage.author
        ? `${newMessage.author.tag || newMessage.author.username} (\`${newMessage.author.id}\`)`
        : (cached?.authorTag ? `${cached.authorTag} (\`${cached.authorId}\`)` : 'Unknown User');

      const authorAvatar = newMessage.author?.displayAvatarURL?.({ dynamic: true }) ||
        cached?.authorAvatar || null;

      const channelDisplay = newMessage.channel
        ? newMessage.channel.toString()
        : `<#${newMessage.channelId}>`;

      const embed = KikiEmbed.build({
        title: '✏️ Message Edited',
        description: `Ek message edit kiya gaya in ${channelDisplay} • [Jump to Message](${newMessage.url || `https://discord.com/channels/${guild.id}/${newMessage.channelId}/${newMessage.id}`})`,
        color: config.COLORS.GOLD || 0xF1C40F,
        thumbnail: authorAvatar,
        fields: [
          { name: '👤 Author', value: authorTag, inline: true },
          { name: '💬 Channel', value: channelDisplay, inline: true },
          { name: '🔴 Pehle (Before)', value: beforeDisplay },
          { name: '🟢 Baad me (After)', value: afterDisplay }
        ]
      });

      await logChannel.send({ embeds: [embed] }).catch(err => {
        console.error('[CHAT LOG SEND ERROR]', err.message);
      });

      // Update cache with new content
      MessageCache.add(newMessage);
    } catch (err) {
      console.error('[CHAT LOG messageUpdate]', err.message);
    }
  }
};
