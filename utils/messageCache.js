// KIKI Bot - In-Memory Message LRU Cache for Accurate Chat Logs & Snipe/EditSnipe
// Stores recent messages so deletes and edits are tracked even if uncached by Discord.js

const MAX_CACHE_SIZE = 1500;
const messageMap = new Map();
const deletedByChannel = new Map();
const editedByChannel = new Map();

const MessageCache = {
  add(message) {
    if (!message || !message.id || message.author?.bot) return;

    if (messageMap.size >= MAX_CACHE_SIZE) {
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
  },

  recordDeleted(channelId, data) {
    if (!channelId || !data) return;
    const list = deletedByChannel.get(channelId) || [];
    list.unshift({ ...data, deletedAt: Date.now() });
    if (list.length > 10) list.length = 10;
    deletedByChannel.set(channelId, list);
  },

  getLastDeleted(channelId, index = 0) {
    const list = deletedByChannel.get(channelId) || [];
    return list[index] || null;
  },

  recordEdited(channelId, data) {
    if (!channelId || !data) return;
    const list = editedByChannel.get(channelId) || [];
    list.unshift({ ...data, editedAt: Date.now() });
    if (list.length > 10) list.length = 10;
    editedByChannel.set(channelId, list);
  },

  getLastEdited(channelId, index = 0) {
    const list = editedByChannel.get(channelId) || [];
    return list[index] || null;
  }
};

module.exports = MessageCache;
