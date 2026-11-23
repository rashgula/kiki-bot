// KIKI Bot - Emoji Steal Command (Single & Bulk/Batch Steal Support)
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const config = require('../../config.js');

const sleep = ms => new Promise(res => setTimeout(res, ms));

function canManageEmojis(member) {
  if (!member) return false;
  if (config.OWNERS?.includes(member.id) || config.CO_OWNERS?.includes(member.id)) return true;
  return member.permissions.has(PermissionFlagsBits.ManageGuildExpressions) ||
         member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers) ||
         member.permissions.has(PermissionFlagsBits.Administrator);
}

// Extract custom Discord emojis from a text string
function extractEmojis(text) {
  if (!text) return [];
  const regex = /<(a?):([a-zA-Z0-9_]+):(\d+)>/g;
  const emojis = [];
  const seen = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    const [raw, anim, name, id] = match;
    if (!seen.has(id)) {
      seen.add(id);
      emojis.push({
        raw,
        animated: anim === 'a',
        name,
        id,
        url: `https://cdn.discordapp.com/emojis/${id}.${anim === 'a' ? 'gif' : 'png'}?quality=lossless`
      });
    }
  }
  return emojis;
}

// Extract custom emojis from message reactions
function extractReactions(msg) {
  if (!msg?.reactions?.cache) return [];
  const emojis = [];
  const seen = new Set();
  for (const [, reaction] of msg.reactions.cache) {
    const rEmoji = reaction.emoji;
    if (rEmoji.id && !seen.has(rEmoji.id)) {
      seen.add(rEmoji.id);
      emojis.push({
        raw: `<${rEmoji.animated ? 'a' : ''}:${rEmoji.name}:${rEmoji.id}>`,
        animated: Boolean(rEmoji.animated),
        name: rEmoji.name || `emoji_${rEmoji.id.slice(-4)}`,
        id: rEmoji.id,
        url: `https://cdn.discordapp.com/emojis/${rEmoji.id}.${rEmoji.animated ? 'gif' : 'png'}?quality=lossless`
      });
    }
  }
  return emojis;
}

// Clean and validate emoji name (2-32 chars, alphanumeric + underscores)
function sanitizeEmojiName(name, fallbackId) {
  let clean = String(name || '').replace(/[^a-zA-Z0-9_]/g, '_');
  if (clean.length < 2) {
    clean = `e_${clean || fallbackId.slice(-4)}`;
  }
  return clean.slice(0, 32);
}

module.exports = {
  // ── Slash Command ─────────────────────────────────────────────
  data: new SlashCommandBuilder()
    .setName('emojisteal')
    .setDescription('🎭 Ek ya bhot saare emojis ek sath steal/add karo!')
    .addStringOption(opt =>
      opt.setName('emojis')
        .setDescription('Emoji ya bhot saare emojis paste karo (custom emojis only)')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('message_id')
        .setDescription('Message ID ya link jisme se emojis steal karne hain')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Naya naam do (agar sirf 1 emoji steal kar rahe ho)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),

  async execute(interaction, client) {
    if (!canManageEmojis(interaction.member)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Permission Nahi Hai!', 'Aapke paas **Manage Emojis & Stickers** permission honi chahiye.')],
        ephemeral: true
      });
    }

    const botMember = interaction.guild.members.me;
    if (!botMember || (!botMember.permissions.has(PermissionFlagsBits.ManageGuildExpressions) && !botMember.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Bot Permission Missing!', 'Bot ke paas **Manage Emojis and Stickers** permission honi chahiye!')],
        ephemeral: true
      });
    }

    const inputEmojis = interaction.options.getString('emojis');
    const messageIdOrLink = interaction.options.getString('message_id');
    const customName = interaction.options.getString('name');

    let emojis = [];

    // Parse from direct emojis option
    if (inputEmojis) {
      emojis.push(...extractEmojis(inputEmojis));
    }

    // Parse from message ID or Link if provided
    if (messageIdOrLink) {
      const matchMsgId = messageIdOrLink.match(/(\d{17,20})$/);
      const targetId = matchMsgId ? matchMsgId[1] : messageIdOrLink.trim();
      const targetMsg = await interaction.channel.messages.fetch(targetId).catch(() => null);
      if (targetMsg) {
        emojis.push(...extractEmojis(targetMsg.content));
        if (emojis.length === 0) {
          emojis.push(...extractReactions(targetMsg));
        }
      }
    }

    // Deduplicate by emoji ID
    const uniqueMap = new Map();
    for (const e of emojis) {
      if (!uniqueMap.has(e.id)) uniqueMap.set(e.id, e);
    }
    emojis = Array.from(uniqueMap.values());

    if (emojis.length === 0) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Emoji Nahi Mila!', 'Koi bhi valid custom emoji nahi mila!\n\n**Usage:**\n• `emojis` option me ek ya bhot saare emojis paste karein: `<:e1:...> <:e2:...>`\n• Ya `message_id` option me message ID / link dekar emojis steal karein.')],
        ephemeral: true
      });
    }

    await interaction.deferReply();

    // ── Single Emoji Steal ───────────────────────────────────────
    if (emojis.length === 1) {
      const e = emojis[0];
      const finalName = sanitizeEmojiName(customName || e.name, e.id);
      try {
        const newEmoji = await interaction.guild.emojis.create({
          attachment: e.url,
          name: finalName,
          reason: `[KIKI Emoji Steal] Added by ${interaction.user.tag}`
        });

        const embed = KikiEmbed.purple(
          '🎭 Emoji Steal Successful!',
          `**Emoji added:** ${newEmoji} \`${newEmoji.name}\`\n` +
          `**Type:** ${e.animated ? 'Animated 🎞️' : 'Static 🖼️'}\n` +
          `**ID:** \`${newEmoji.id}\`\n` +
          `**Use karo:** \`<${e.animated ? 'a' : ''}:${newEmoji.name}:${newEmoji.id}>\``
        );
        embed.setThumbnail(e.url);

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[EMOJI STEAL]', err.message);
        let errMsg = 'Emoji add nahi hua. Server emoji slots full ho sakte hain ya permission issue ho sakta hai.';
        if (err.message.includes('Maximum')) errMsg = '❌ Server mein **emoji slots full** hain! Pehle koi purana emoji delete karein.';
        return interaction.editReply({ embeds: [KikiEmbed.error('Emoji Steal Failed!', errMsg)] });
      }
    }

    // ── Bulk / Multiple Emoji Steal ─────────────────────────────
    const cap = Math.min(emojis.length, 30);
    const toProcess = emojis.slice(0, cap);

    await interaction.editReply({
      embeds: [KikiEmbed.purple('⏳ Batch Emoji Steal In Progress...', `**${toProcess.length}** emojis ko steal kiya ja raha hai...\nKripya thoda wait karein. ✨`)]
    });

    const added = [];
    const failed = [];

    for (let i = 0; i < toProcess.length; i++) {
      const e = toProcess[i];
      const finalName = sanitizeEmojiName(e.name, e.id);
      try {
        const newEmoji = await interaction.guild.emojis.create({
          attachment: e.url,
          name: finalName,
          reason: `[KIKI Batch Emoji Steal] Added by ${interaction.user.tag}`
        });
        added.push(newEmoji);
      } catch (err) {
        console.error(`[EMOJI BATCH ERROR] ${e.name}:`, err.message);
        failed.push({ emoji: e, reason: err.message.includes('Maximum') ? 'Slots Full' : 'Failed' });
        if (err.message.includes('Maximum')) {
          break; // Stop immediately if server slots are full
        }
      }
      if (i < toProcess.length - 1) {
        await sleep(750); // Respect Discord rate limits
      }
    }

    const summaryDesc =
      `**Successfully Added:** \`${added.length}/${toProcess.length}\` emojis\n\n` +
      (added.length > 0 ? `**Added Emojis:**\n${added.map(e => `${e} \`${e.name}\``).join('  ')}\n\n` : '') +
      (failed.length > 0 ? `⚠️ **Failed Emojis (${failed.length}):**\n${failed.map(f => `• \`${f.emoji.name}\` (${f.reason})`).join('\n')}\n\n` : '') +
      `*Total Emojis in Server:* \`${interaction.guild.emojis.cache.size}\``;

    const summaryEmbed = KikiEmbed.build({
      title: `🎭 Batch Emoji Steal Completed (${added.length}/${toProcess.length})`,
      description: summaryDesc,
      color: added.length > 0 ? (config.COLORS?.PRIMARY || 0x9B59B6) : (config.COLORS?.RED || 0xE74C3C),
      timestamp: true
    });

    return interaction.editReply({ embeds: [summaryEmbed] });
  },

  // ── Prefix Command ────────────────────────────────────────────
  name: 'emojisteal',
  aliases: ['esteal', 'stealemoji', 'addemoji', 'ea', 'steal', 'stealall', 'masssteal', 'emojissteal', 'stealemojis', 'estealall'],
  async run(message, args, client) {
    if (!canManageEmojis(message.member)) {
      return message.reply({ embeds: [KikiEmbed.error('Permission Nahi!', 'Aapke paas `Manage Emojis & Stickers` permission honi chahiye.')] });
    }

    const botMember = message.guild.members.me;
    if (!botMember || (!botMember.permissions.has(PermissionFlagsBits.ManageGuildExpressions) && !botMember.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))) {
      return message.reply({ embeds: [KikiEmbed.error('Bot Permission Missing!', 'Bot ke paas `Manage Emojis & Stickers` permission honi chahiye!')] });
    }

    let emojis = [];
    let customName = null;

    // 1. Check if replying to a message
    const refMsg = message.reference
      ? await message.channel.messages.fetch(message.reference.messageId).catch(() => null)
      : null;

    if (refMsg) {
      emojis.push(...extractEmojis(refMsg.content));
      if (emojis.length === 0) {
        emojis.push(...extractReactions(refMsg));
      }

      // If user replied to a message with stickers and NO emojis, delegate to sticker steal!
      if (emojis.length === 0 && refMsg.stickers && refMsg.stickers.size > 0) {
        const stickerCmd = client.prefixCommands.get('stickersteal');
        if (stickerCmd) {
          return stickerCmd.run(message, args, client);
        }
      }
    }

    // 2. Check if user passed a message link or message ID in args
    if (emojis.length === 0 && args[0]) {
      const matchMsgId = args[0].match(/(\d{17,20})$/);
      if (matchMsgId) {
        const targetMsg = await message.channel.messages.fetch(matchMsgId[1]).catch(() => null);
        if (targetMsg) {
          emojis.push(...extractEmojis(targetMsg.content));
          if (emojis.length === 0) {
            emojis.push(...extractReactions(targetMsg));
          }
          if (emojis.length === 0 && targetMsg.stickers && targetMsg.stickers.size > 0) {
            const stickerCmd = client.prefixCommands.get('stickersteal');
            if (stickerCmd) {
              return stickerCmd.run(message, args, client);
            }
          }
        }
      }
    }

    // 3. Check if user typed emojis directly in the command
    const contentEmojis = extractEmojis(message.content);
    if (contentEmojis.length > 0) {
      emojis.push(...contentEmojis);
      if (contentEmojis.length === 1 && args[1]) {
        customName = args[1];
      }
    }

    // 4. Check for direct image attachment or image link
    if (emojis.length === 0) {
      const attachment = message.attachments.first();
      const imageUrl = attachment?.url || (args[0]?.match(/^https?:\/\/.*\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i) ? args[0] : null);
      if (imageUrl) {
        const imgName = sanitizeEmojiName(args[attachment ? 0 : 1] || 'custom_emoji', 'img');
        const animated = imageUrl.includes('.gif');
        const loadingMsg = await message.reply({ embeds: [KikiEmbed.purple('🎭 Stealing Emoji...', 'Ruk, image se emoji create ho raha hai...')] });
        try {
          const newEmoji = await message.guild.emojis.create({
            attachment: imageUrl,
            name: imgName,
            reason: `[KIKI Image Emoji Steal] Added by ${message.author.tag}`
          });
          const embed = KikiEmbed.purple(
            '🎭 Emoji Steal Successful!',
            `**Emoji added:** ${newEmoji} \`${newEmoji.name}\`\n` +
            `**Type:** ${animated ? 'Animated 🎞️' : 'Static 🖼️'}\n` +
            `**ID:** \`${newEmoji.id}\``
          );
          embed.setThumbnail(imageUrl);
          return loadingMsg.edit({ embeds: [embed] });
        } catch (err) {
          return loadingMsg.edit({ embeds: [KikiEmbed.error('Emoji Create Failed!', err.message)] });
        }
      }
    }

    // Deduplicate by emoji ID
    const uniqueMap = new Map();
    for (const e of emojis) {
      if (!uniqueMap.has(e.id)) uniqueMap.set(e.id, e);
    }
    emojis = Array.from(uniqueMap.values());

    if (emojis.length === 0) {
      return message.reply({
        embeds: [KikiEmbed.purple(
          '🎭 Emoji Steal (Ek Sath Bhot Saare Emojis Steal Karo!)',
          `**1. Bhot Saare Emojis Ek Sath:**\n` +
          `\`&steal <:emoji1:123> <:emoji2:456> <:emoji3:789>\`\n\n` +
          `**2. Kisi Message Ko Reply Karke Steal Karo:**\n` +
          `Jis message me emojis hain usko **reply** karein aur type karein: \`&steal\` ya \`&esteal\`\n\n` +
          `**3. Message Link Se:**\n` +
          `\`&steal https://discord.com/channels/.../messageId\`\n\n` +
          `**4. Image / GIF Se:**\n` +
          `Photo upload karke ya link dalkar: \`&steal <link> [naam]\`\n\n` +
          `**Aliases:** \`&steal\`, \`&esteal\`, \`&stealall\`, \`&masssteal\`, \`&emojisteal\``
        )]
      });
    }

    // ── Single Emoji Steal ───────────────────────────────────────
    if (emojis.length === 1) {
      const e = emojis[0];
      const finalName = sanitizeEmojiName(customName || e.name, e.id);
      const loadingMsg = await message.reply({ embeds: [KikiEmbed.purple('🎭 Stealing Emoji...', `\`${finalName}\` add ho raha hai...`)] });

      try {
        const newEmoji = await message.guild.emojis.create({
          attachment: e.url,
          name: finalName,
          reason: `[KIKI Emoji Steal] Added by ${message.author.tag}`
        });

        const embed = KikiEmbed.purple(
          '🎭 Emoji Steal Successful!',
          `**Emoji added:** ${newEmoji} \`${newEmoji.name}\`\n` +
          `**Type:** ${e.animated ? 'Animated 🎞️' : 'Static 🖼️'}\n` +
          `**ID:** \`${newEmoji.id}\`\n` +
          `**Use karo:** \`<${e.animated ? 'a' : ''}:${newEmoji.name}:${newEmoji.id}>\``
        );
        embed.setThumbnail(e.url);

        return loadingMsg.edit({ embeds: [embed] });
      } catch (err) {
        console.error('[EMOJI STEAL]', err.message);
        let errMsg = 'Emoji add nahi hua! Server emoji slots full ho sakte hain.';
        if (err.message.includes('Maximum')) errMsg = '❌ Server mein **emoji slots full** hain! Pehle koi purana emoji delete karo.';
        return loadingMsg.edit({ embeds: [KikiEmbed.error('Emoji Steal Failed!', errMsg)] });
      }
    }

    // ── Bulk / Multiple Emoji Steal ─────────────────────────────
    const cap = Math.min(emojis.length, 30);
    const toProcess = emojis.slice(0, cap);

    const progressMsg = await message.reply({
      embeds: [KikiEmbed.purple('⏳ Batch Emoji Steal In Progress...', `**${toProcess.length}** emojis ko server me add kiya ja raha hai...\nThoda intezaar karein ✨`)]
    });

    const added = [];
    const failed = [];

    for (let i = 0; i < toProcess.length; i++) {
      const e = toProcess[i];
      const finalName = sanitizeEmojiName(e.name, e.id);
      try {
        const newEmoji = await message.guild.emojis.create({
          attachment: e.url,
          name: finalName,
          reason: `[KIKI Batch Emoji Steal] Added by ${message.author.tag}`
        });
        added.push(newEmoji);
      } catch (err) {
        console.error(`[EMOJI BATCH ERROR] ${e.name}:`, err.message);
        failed.push({ emoji: e, reason: err.message.includes('Maximum') ? 'Slots Full' : 'Failed' });
        if (err.message.includes('Maximum')) {
          break; // Stop loop early if server slots are exhausted
        }
      }
      if (i < toProcess.length - 1) {
        await sleep(750); // Respect rate limits
      }
    }

    const summaryDesc =
      `**Successfully Added:** \`${added.length}/${toProcess.length}\` emojis\n\n` +
      (added.length > 0 ? `**Added Emojis:**\n${added.map(e => `${e} \`${e.name}\``).join('  ')}\n\n` : '') +
      (failed.length > 0 ? `⚠️ **Failed Emojis (${failed.length}):**\n${failed.map(f => `• \`${f.emoji.name}\` (${f.reason})`).join('\n')}\n\n` : '') +
      `*Total Server Emojis:* \`${message.guild.emojis.cache.size}\``;

    const summaryEmbed = KikiEmbed.build({
      title: `🎭 Batch Emoji Steal Completed (${added.length}/${toProcess.length})`,
      description: summaryDesc,
      color: added.length > 0 ? (config.COLORS?.PRIMARY || 0x9B59B6) : (config.COLORS?.RED || 0xE74C3C),
      timestamp: true
    });

    return progressMsg.edit({ embeds: [summaryEmbed] });
  }
};
