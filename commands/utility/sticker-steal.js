// KIKI Bot - Sticker Steal Command
const { SlashCommandBuilder, PermissionFlagsBits, StickerFormatType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  // ── Slash Command ─────────────────────────────────────────────
  data: new SlashCommandBuilder()
    .setName('stickersteal')
    .setDescription('🎟️ Kisi message ke sticker ko apne server mein add karo!')
    .addStringOption(opt =>
      opt.setName('message_id')
        .setDescription('Us message ka ID jisme sticker hai')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Sticker ka naam (optional, sticker ka naam use hoga by default)')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('description')
        .setDescription('Sticker ki description (optional)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuildExpressions) &&
        !interaction.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Permission Nahi!', '`Manage Emojis & Stickers` permission chahiye.')],
        ephemeral: true
      });
    }

    const messageId = interaction.options.getString('message_id');
    const customName = interaction.options.getString('name');
    const customDesc = interaction.options.getString('description');

    await interaction.deferReply();

    // Fetch message
    const targetMsg = await interaction.channel.messages.fetch(messageId).catch(() => null);
    if (!targetMsg) {
      return interaction.editReply({
        embeds: [KikiEmbed.error('Message Nahi Mila!', 'Is channel mein ye message nahi mila.\nSahi message ID dalo aur same channel mein command use karo.')]
      });
    }

    const sticker = targetMsg.stickers?.first();
    if (!sticker) {
      return interaction.editReply({
        embeds: [KikiEmbed.error('Sticker Nahi Hai!', 'Is message mein koi sticker nahi hai!')]
      });
    }

    // Lottie (animated) stickers cannot be added by bots
    if (sticker.format === StickerFormatType.Lottie) {
      return interaction.editReply({
        embeds: [KikiEmbed.error('Lottie Sticker!', 'Discord ke **Lottie (animated)** stickers bots add nahi kar sakte.\nSirf **PNG** aur **APNG** stickers steal ho sakte hain.')]
      });
    }

    const stickerURL = sticker.url;
    const stickerName = customName || sticker.name;
    const stickerDesc = customDesc || sticker.description || 'Added by KIKI Bot';
    const stickerTags = sticker.tags || '✨';

    try {
      const newSticker = await interaction.guild.stickers.create({
        file: stickerURL,
        name: stickerName,
        tags: stickerTags,
        description: stickerDesc,
        reason: `[KIKI Sticker Steal] Added by ${interaction.user.tag}`
      });

      const embed = KikiEmbed.purple(
        '🎟️ Sticker Steal Successful!',
        `**Sticker Added:** \`${newSticker.name}\`\n` +
        `**ID:** \`${newSticker.id}\`\n` +
        `**Format:** ${sticker.format === StickerFormatType.APNG ? 'Animated PNG 🎞️' : 'Static PNG 🖼️'}\n` +
        `**Description:** ${stickerDesc}\n` +
        `**Tags:** ${stickerTags}`
      );
      embed.setImage(stickerURL);

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[STICKER STEAL]', err.message);
      let errMsg = 'Sticker add nahi hua!\n• Server sticker slots full hain\n• Bot ko Manage Emojis permission nahi\n• Sticker format supported nahi';
      if (err.message.includes('Maximum')) errMsg = '❌ Server mein **sticker slots full** hain! Pehle koi purana sticker delete karo.';
      return interaction.editReply({ embeds: [KikiEmbed.error('Sticker Steal Failed!', errMsg)] });
    }
  },

  // ── Prefix Command ────────────────────────────────────────────
  name: 'stickersteal',
  aliases: ['ssteal', 'stealsticker', 'addsticker', 'sa'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuildExpressions) &&
        !message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
      return message.reply({ embeds: [KikiEmbed.error('Permission Nahi!', '`Manage Emojis & Stickers` permission chahiye.')] });
    }

    // Check if replying to a message with sticker
    const refMsg = message.reference
      ? await message.channel.messages.fetch(message.reference.messageId).catch(() => null)
      : null;

    const targetMsg = refMsg || (args[0] ? await message.channel.messages.fetch(args[0]).catch(() => null) : null);

    if (!targetMsg) {
      return message.reply({
        embeds: [KikiEmbed.purple('🎟️ Sticker Steal', '**Usage:**\n`&stickersteal <message_id>` — message ID se\n`&stickersteal` — sticker wale message ko **reply** karo\n\n**Aliases:** `&ssteal`, `&stealsticker`, `&addsticker`')]
      });
    }

    const sticker = targetMsg.stickers?.first();
    if (!sticker) {
      return message.reply({ embeds: [KikiEmbed.error('Sticker Nahi!', 'Is message mein koi sticker nahi hai!')] });
    }

    if (sticker.format === StickerFormatType.Lottie) {
      return message.reply({ embeds: [KikiEmbed.error('Lottie Sticker!', 'Lottie animated stickers bots add nahi kar sakte. Sirf PNG/APNG stickers steal ho sakte hain.')] });
    }

    const customName = args[1] || sticker.name;
    const stickerURL = sticker.url;
    const stickerDesc = sticker.description || 'Added by KIKI Bot';
    const stickerTags = sticker.tags || '✨';

    const msg = await message.reply({ embeds: [KikiEmbed.purple('🎟️ Stealing Sticker...', 'Ruk, sticker add ho raha hai...')] });

    try {
      const newSticker = await message.guild.stickers.create({
        file: stickerURL,
        name: customName,
        tags: stickerTags,
        description: stickerDesc,
        reason: `[KIKI Sticker Steal] Added by ${message.author.tag}`
      });

      const embed = KikiEmbed.purple(
        '🎟️ Sticker Steal Successful!',
        `**Sticker Added:** \`${newSticker.name}\`\n` +
        `**ID:** \`${newSticker.id}\`\n` +
        `**Format:** ${sticker.format === StickerFormatType.APNG ? 'Animated PNG 🎞️' : 'Static PNG 🖼️'}\n` +
        `**Description:** ${stickerDesc}`
      );
      embed.setImage(stickerURL);

      return msg.edit({ embeds: [embed] });
    } catch (err) {
      console.error('[STICKER STEAL]', err.message);
      let errMsg = 'Sticker add nahi hua!\n• Server sticker slots full hain\n• Bot ko Manage Emojis permission nahi';
      if (err.message.includes('Maximum')) errMsg = '❌ Server mein **sticker slots full** hain!';
      return msg.edit({ embeds: [KikiEmbed.error('Sticker Steal Failed!', errMsg)] });
    }
  }
};
