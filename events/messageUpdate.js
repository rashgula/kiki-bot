// KIKI Bot - Message Update Event (Chat Logs)
const { ChannelType } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');
const config = require('../config.js');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // Ignore link previews / embed renders
    if (!oldMessage.content && !newMessage.content) return;

    const cfg = KIKI.loadConfig();
    const chatLogId = cfg.chat_log_channel_id;
    if (!chatLogId) return;

    // Do not log edits inside the log channel itself
    if (newMessage.channelId === chatLogId) return;

    try {
      const logChannel = newMessage.guild.channels.cache.get(chatLogId) || await newMessage.guild.channels.fetch(chatLogId).catch(() => null);
      if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

      const oldContent = oldMessage.content
        ? (oldMessage.content.length > 500 ? oldMessage.content.slice(0, 500) + '...' : oldMessage.content)
        : '*[Previous content not cached]*';

      const newContent = newMessage.content
        ? (newMessage.content.length > 500 ? newMessage.content.slice(0, 500) + '...' : newMessage.content)
        : '*[Empty]*';

      const embed = KikiEmbed.build({
        title: '✏️ Message Edited',
        description: `Ek message edit kiya gaya in ${newMessage.channel.toString()} • [Jump to Message](${newMessage.url})`,
        color: config.COLORS.GOLD || 0xF1C40F,
        thumbnail: newMessage.author?.displayAvatarURL({ dynamic: true }) || null,
        fields: [
          { name: '👤 Author', value: newMessage.author ? `${newMessage.author.tag} (\`${newMessage.author.id}\`)` : 'Unknown User', inline: true },
          { name: '💬 Channel', value: `${newMessage.channel.toString()}`, inline: true },
          { name: '🔴 Pehle (Before)', value: oldContent },
          { name: '🟢 Baad me (After)', value: newContent }
        ]
      });

      await logChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      console.error('[CHAT LOG messageUpdate]', err.message);
    }
  }
};
