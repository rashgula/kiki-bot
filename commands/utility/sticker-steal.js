// KIKI Bot - Sticker Steal Command (Single & Bulk/Batch Steal Support)
const { SlashCommandBuilder, PermissionFlagsBits, StickerFormatType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const config = require('../../config.js');

const sleep = ms => new Promise(res => setTimeout(res, ms));

function canManageStickers(member) {
  if (!member) return false;
  if (config.OWNERS?.includes(member.id) || config.CO_OWNERS?.includes(member.id)) return true;
  return member.permissions.has(PermissionFlagsBits.ManageGuildExpressions) ||
         member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers) ||
         member.permissions.has(PermissionFlagsBits.Administrator);
}

// Clean and validate sticker name (2-30 characters)
function sanitizeStickerName(name, fallbackId) {
  let clean = String(name || '').replace(/[^a-zA-Z0-9_ -]/g, '').trim();
  if (clean.length < 2) {
    clean = `sticker_${fallbackId ? fallbackId.slice(-4) : 'kiki'}`;
  }
  return clean.slice(0, 30);
}

// Format name helper for display
function getFormatName(format) {
  switch (format) {
    case StickerFormatType.APNG: return 'Animated PNG 🎞️';
    case StickerFormatType.Lottie: return 'Lottie (Unsupported) ❌';
    case StickerFormatType.GIF: return 'GIF 🎞️';
    case StickerFormatType.PNG:
    default:
      return 'Static PNG 🖼️';
  }
}

module.exports = {
  // ── Slash Command ─────────────────────────────────────────────
  data: new SlashCommandBuilder()
    .setName('stickersteal')
    .setDescription('🎟️ Ek ya bhot saare stickers ek sath apne server mein add karo!')
    .addStringOption(opt =>
      opt.setName('message_id')
        .setDescription('Message ID ya link jisme stickers hain (optional)')
        .setRequired(false))
    .addIntegerOption(opt =>
      opt.setName('scan_count')
        .setDescription('Channel ke recent messages me se kitne scan karne hain (default 15, max 50)')
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Naya naam (agar sirf 1 sticker ho)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),

  async execute(interaction, client) {
    if (!canManageStickers(interaction.member)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Permission Nahi!', 'Aapke paas `Manage Emojis & Stickers` permission honi chahiye.')],
        ephemeral: true
      });
    }

    const botMember = interaction.guild.members.me;
    if (!botMember || (!botMember.permissions.has(PermissionFlagsBits.ManageGuildExpressions) && !botMember.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Bot Permission Missing!', 'Bot ke paas `Manage Emojis & Stickers` permission honi chahiye!')],
        ephemeral: true
      });
    }

    const messageIdOrLink = interaction.options.getString('message_id');
    const scanCount = interaction.options.getInteger('scan_count');
    const customName = interaction.options.getString('name');

    await interaction.deferReply();

    let stickers = [];
    const seen = new Set();

    // 1. If message_id provided
    if (messageIdOrLink) {
      const matchMsgId = messageIdOrLink.match(/(\d{17,20})$/);
      const targetId = matchMsgId ? matchMsgId[1] : messageIdOrLink.trim();
      const targetMsg = await interaction.channel.messages.fetch(targetId).catch(() => null);
      if (targetMsg && targetMsg.stickers?.size > 0) {
        for (const [, s] of targetMsg.stickers) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            stickers.push(s);
          }
        }
      }
    }

    // 2. Scan recent messages if requested or if no message_id given
    if (stickers.length === 0) {
      const limit = scanCount || 15;
      const recent = await interaction.channel.messages.fetch({ limit }).catch(() => null);
      if (recent) {
        for (const [, msg] of recent) {
          if (msg.stickers?.size > 0) {
            for (const [, s] of msg.stickers) {
              if (!seen.has(s.id)) {
                seen.add(s.id);
                stickers.push(s);
              }
            }
          }
        }
      }
    }

    if (stickers.length === 0) {
      return interaction.editReply({
        embeds: [KikiEmbed.error('Sticker Nahi Mila!', 'Channel ke messages mein koi sticker nahi mila!\n\n**Usage:**\n• `message_id`: Sticker wale message ka ID ya link dein.\n• `scan_count`: Recent messages scan karke saare stickers steal karein.')]
      });
    }

    // Filter out Lottie stickers (Discord API rejects bot uploads for Lottie)
    const validStickers = stickers.filter(s => s.format !== StickerFormatType.Lottie);
    const lottieCount = stickers.length - validStickers.length;

    if (validStickers.length === 0) {
      return interaction.editReply({
        embeds: [KikiEmbed.error('Lottie Stickers!', `Milne wale saare (${lottieCount}) stickers **Lottie animated** hain jo Discord bot API se upload nahi ho sakte.\nSirf **PNG** aur **APNG** stickers steal ho sakte hain.`)]
      });
    }

    // ── Single Sticker Steal ─────────────────────────────────────
    if (validStickers.length === 1) {
      const s = validStickers[0];
      const stickerName = sanitizeStickerName(customName || s.name, s.id);
      const stickerDesc = s.description || 'Added by KIKI Bot';
      const stickerTags = s.tags || '✨';

      try {
        const newSticker = await interaction.guild.stickers.create({
          file: s.url,
          name: stickerName,
          tags: stickerTags,
          description: stickerDesc,
          reason: `[KIKI Sticker Steal] Added by ${interaction.user.tag}`
        });

        const embed = KikiEmbed.purple(
          '🎟️ Sticker Steal Successful!',
          `**Sticker Added:** \`${newSticker.name}\`\n` +
          `**ID:** \`${newSticker.id}\`\n` +
          `**Format:** ${getFormatName(s.format)}\n` +
          `**Tags:** ${stickerTags}`
        );
        embed.setImage(s.url);

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[STICKER STEAL]', err.message);
        let errMsg = 'Sticker add nahi hua! Server sticker slots full ho sakte hain ya format issue ho sakta hai.';
        if (err.message.includes('Maximum')) errMsg = '❌ Server mein **sticker slots full** hain! Pehle koi purana sticker delete karein.';
        return interaction.editReply({ embeds: [KikiEmbed.error('Sticker Steal Failed!', errMsg)] });
      }
    }

    // ── Bulk / Multiple Sticker Steal ───────────────────────────
    const cap = Math.min(validStickers.length, 15);
    const toProcess = validStickers.slice(0, cap);

    await interaction.editReply({
      embeds: [KikiEmbed.purple('⏳ Batch Sticker Steal In Progress...', `**${toProcess.length}** stickers ko server mein add kiya ja raha hai...\nThoda intezaar karein ✨`)]
    });

    const added = [];
    const failed = [];

    for (let i = 0; i < toProcess.length; i++) {
      const s = toProcess[i];
      const stickerName = sanitizeStickerName(s.name, s.id);
      const stickerTags = s.tags || '✨';
      const stickerDesc = s.description || 'Added by KIKI Bot';

      try {
        const newSticker = await interaction.guild.stickers.create({
          file: s.url,
          name: stickerName,
          tags: stickerTags,
          description: stickerDesc,
          reason: `[KIKI Batch Sticker Steal] Added by ${interaction.user.tag}`
        });
        added.push(newSticker);
      } catch (err) {
        console.error(`[STICKER BATCH ERROR] ${s.name}:`, err.message);
        failed.push({ sticker: s, reason: err.message.includes('Maximum') ? 'Slots Full' : 'Failed' });
        if (err.message.includes('Maximum')) {
          break; // Stop immediately if slots are exhausted
        }
      }

      if (i < toProcess.length - 1) {
        await sleep(1000); // 1s delay for sticker endpoint rate limits
      }
    }

    const summaryDesc =
      `**Successfully Added:** \`${added.length}/${toProcess.length}\` stickers\n\n` +
      (added.length > 0 ? `**Added Stickers:**\n${added.map(s => `• **${s.name}** (\`${s.id}\`)`).join('\n')}\n\n` : '') +
      (failed.length > 0 ? `⚠️ **Failed Stickers (${failed.length}):**\n${failed.map(f => `• \`${f.sticker.name}\` (${f.reason})`).join('\n')}\n\n` : '') +
      (lottieCount > 0 ? `ℹ️ *${lottieCount} Lottie stickers skip kiye gaye (Discord Bot API limitation).*\n\n` : '') +
      `*Total Server Stickers:* \`${interaction.guild.stickers.cache.size}\``;

    const summaryEmbed = KikiEmbed.build({
      title: `🎟️ Batch Sticker Steal Completed (${added.length}/${toProcess.length})`,
      description: summaryDesc,
      color: added.length > 0 ? (config.COLORS?.PRIMARY || 0x9B59B6) : (config.COLORS?.RED || 0xE74C3C),
      timestamp: true
    });

    return interaction.editReply({ embeds: [summaryEmbed] });
  },

  // ── Prefix Command ────────────────────────────────────────────
  name: 'stickersteal',
  aliases: ['ssteal', 'stealsticker', 'addsticker', 'sa', 'stickerssteal', 'stealstickers', 'sstealall', 'masssticker', 'stickerscan'],
  async run(message, args, client) {
    if (!canManageStickers(message.member)) {
      return message.reply({ embeds: [KikiEmbed.error('Permission Nahi!', 'Aapke paas `Manage Emojis & Stickers` permission honi chahiye.')] });
    }

    const botMember = message.guild.members.me;
    if (!botMember || (!botMember.permissions.has(PermissionFlagsBits.ManageGuildExpressions) && !botMember.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))) {
      return message.reply({ embeds: [KikiEmbed.error('Bot Permission Missing!', 'Bot ke paas `Manage Emojis & Stickers` permission honi chahiye!')] });
    }

    let stickers = [];
    const seen = new Set();
    let customName = null;

    // 1. Check if replying to a message
    const refMsg = message.reference
      ? await message.channel.messages.fetch(message.reference.messageId).catch(() => null)
      : null;

    if (refMsg && refMsg.stickers?.size > 0) {
      for (const [, s] of refMsg.stickers) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          stickers.push(s);
        }
      }
      if (stickers.length === 1 && args[0]) {
        customName = args[0];
      }
    }

    // 2. Check if user passed message ID or Link in args
    if (stickers.length === 0 && args[0]) {
      const matchMsgId = args[0].match(/(\d{17,20})$/);
      if (matchMsgId) {
        const targetMsg = await message.channel.messages.fetch(matchMsgId[1]).catch(() => null);
        if (targetMsg && targetMsg.stickers?.size > 0) {
          for (const [, s] of targetMsg.stickers) {
            if (!seen.has(s.id)) {
              seen.add(s.id);
              stickers.push(s);
            }
          }
          if (stickers.length === 1 && args[1]) {
            customName = args[1];
          }
        }
      }
    }

    // 3. Scan recent channel messages if user passed "scan", "all", a number, or just typed &ssteal
    if (stickers.length === 0) {
      let scanLimit = 20;
      if (args[0] && !isNaN(args[0])) {
        scanLimit = Math.min(Math.max(parseInt(args[0]), 1), 50);
      } else if (args[0] && (args[0].toLowerCase() === 'scan' || args[0].toLowerCase() === 'all')) {
        scanLimit = args[1] && !isNaN(args[1]) ? Math.min(Math.max(parseInt(args[1]), 1), 50) : 30;
      }

      const recent = await message.channel.messages.fetch({ limit: scanLimit }).catch(() => null);
      if (recent) {
        for (const [, msg] of recent) {
          if (msg.stickers?.size > 0) {
            for (const [, s] of msg.stickers) {
              if (!seen.has(s.id)) {
                seen.add(s.id);
                stickers.push(s);
              }
            }
          }
        }
      }
    }

    if (stickers.length === 0) {
      return message.reply({
        embeds: [KikiEmbed.purple(
          '🎟️ Sticker Steal (Ek Sath Bhot Saare Stickers Steal Karo!)',
          `**1. Sticker Wale Message Ko Reply Karein:**\n` +
          `Message ko **reply** karein aur type karein: \`&ssteal\` (saare stickers add ho jayenge!)\n\n` +
          `**2. Recent Chat Ke Saare Stickers Scan Karke Steal Karo:**\n` +
          `• \`&ssteal scan 20\` — last 20 messages scan karke saare stickers steal karein\n` +
          `• \`&ssteal 15\` — last 15 messages scan karein\n\n` +
          `**3. Message ID / Link Se:**\n` +
          `\`&ssteal <message_id_or_link> [naam]\`\n\n` +
          `**Aliases:** \`&ssteal\`, \`&stealsticker\`, \`&addsticker\`, \`&sstealall\`, \`&masssticker\``
        )]
      });
    }

    // Filter out Lottie stickers
    const validStickers = stickers.filter(s => s.format !== StickerFormatType.Lottie);
    const lottieCount = stickers.length - validStickers.length;

    if (validStickers.length === 0) {
      return message.reply({
        embeds: [KikiEmbed.error('Lottie Stickers!', `Milne wale saare (${lottieCount}) stickers **Lottie animated** hain jo Discord bot API se add nahi kiye ja sakte.\nSirf **PNG** aur **APNG** stickers steal ho sakte hain.`)]
      });
    }

    // ── Single Sticker Steal ─────────────────────────────────────
    if (validStickers.length === 1) {
      const s = validStickers[0];
      const stickerName = sanitizeStickerName(customName || s.name, s.id);
      const stickerDesc = s.description || 'Added by KIKI Bot';
      const stickerTags = s.tags || '✨';

      const loadingMsg = await message.reply({ embeds: [KikiEmbed.purple('🎟️ Stealing Sticker...', `\`${stickerName}\` add ho raha hai...`)] });

      try {
        const newSticker = await message.guild.stickers.create({
          file: s.url,
          name: stickerName,
          tags: stickerTags,
          description: stickerDesc,
          reason: `[KIKI Sticker Steal] Added by ${message.author.tag}`
        });

        const embed = KikiEmbed.purple(
          '🎟️ Sticker Steal Successful!',
          `**Sticker Added:** \`${newSticker.name}\`\n` +
          `**ID:** \`${newSticker.id}\`\n` +
          `**Format:** ${getFormatName(s.format)}\n` +
          `**Tags:** ${stickerTags}`
        );
        embed.setImage(s.url);

        return loadingMsg.edit({ embeds: [embed] });
      } catch (err) {
        console.error('[STICKER STEAL]', err.message);
        let errMsg = 'Sticker add nahi hua! Server sticker slots full ho sakte hain.';
        if (err.message.includes('Maximum')) errMsg = '❌ Server mein **sticker slots full** hain!';
        return loadingMsg.edit({ embeds: [KikiEmbed.error('Sticker Steal Failed!', errMsg)] });
      }
    }

    // ── Bulk / Multiple Sticker Steal ───────────────────────────
    const cap = Math.min(validStickers.length, 15);
    const toProcess = validStickers.slice(0, cap);

    const progressMsg = await message.reply({
      embeds: [KikiEmbed.purple('⏳ Batch Sticker Steal In Progress...', `**${toProcess.length}** stickers ko server mein add kiya ja raha hai...\nThoda intezaar karein ✨`)]
    });

    const added = [];
    const failed = [];

    for (let i = 0; i < toProcess.length; i++) {
      const s = toProcess[i];
      const stickerName = sanitizeStickerName(s.name, s.id);
      const stickerTags = s.tags || '✨';
      const stickerDesc = s.description || 'Added by KIKI Bot';

      try {
        const newSticker = await message.guild.stickers.create({
          file: s.url,
          name: stickerName,
          tags: stickerTags,
          description: stickerDesc,
          reason: `[KIKI Batch Sticker Steal] Added by ${message.author.tag}`
        });
        added.push(newSticker);
      } catch (err) {
        console.error(`[STICKER BATCH ERROR] ${s.name}:`, err.message);
        failed.push({ sticker: s, reason: err.message.includes('Maximum') ? 'Slots Full' : 'Failed' });
        if (err.message.includes('Maximum')) {
          break; // Stop immediately if slots are exhausted
        }
      }

      if (i < toProcess.length - 1) {
        await sleep(1000); // 1s delay for sticker endpoint rate limits
      }
    }

    const summaryDesc =
      `**Successfully Added:** \`${added.length}/${toProcess.length}\` stickers\n\n` +
      (added.length > 0 ? `**Added Stickers:**\n${added.map(s => `• **${s.name}** (\`${s.id}\`)`).join('\n')}\n\n` : '') +
      (failed.length > 0 ? `⚠️ **Failed Stickers (${failed.length}):**\n${failed.map(f => `• \`${f.sticker.name}\` (${f.reason})`).join('\n')}\n\n` : '') +
      (lottieCount > 0 ? `ℹ️ *${lottieCount} Lottie stickers skip kiye gaye (Discord Bot API limitation).*\n\n` : '') +
      `*Total Server Stickers:* \`${message.guild.stickers.cache.size}\``;

    const summaryEmbed = KikiEmbed.build({
      title: `🎟️ Batch Sticker Steal Completed (${added.length}/${toProcess.length})`,
      description: summaryDesc,
      color: added.length > 0 ? (config.COLORS?.PRIMARY || 0x9B59B6) : (config.COLORS?.RED || 0xE74C3C),
      timestamp: true
    });

    return progressMsg.edit({ embeds: [summaryEmbed] });
  }
};
