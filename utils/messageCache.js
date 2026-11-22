// KIKI Bot - In-Memory Message LRU Cache for Accurate Chat Logs
// Stores recent messages so deletes and edits are 100% tracked even if uncached by Discord.js

const MAX_CACHE_SIZE = 1500;
const messageMap = new Map();

const MessageCache = {
  add(message) {
    if (!message || !message.id || message.author?.bot) return;

    if (messageMap.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = messageMap.keys().next().value;
      messageMap.delete(oldestKey);
    }

    messageMap.set(message.id, {
      id: message.id,
      guildId: message.guildId,
      channelId: message.channelId,
      content: message.content || '',
      authorId: message.author?.id,
      authorTag: message.author?.tag || message.author?.username,
      authorAvatar: message.author?.displayAvatarURL?.({ dynamic: true }) || null,
      createdAt: message.createdTimestamp || Date.now(),
      attachments: message.attachments?.map(a => a.url) || []
    });
  },

  get(messageId) {
    return messageMap.get(messageId) || null;
  },

  remove(messageId) {
    messageMap.delete(messageId);
  }
};

module.exports = MessageCache;
