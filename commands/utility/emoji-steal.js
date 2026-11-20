// KIKI Bot - Emoji Steal Command
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  // ── Slash Command ─────────────────────────────────────────────
  data: new SlashCommandBuilder()
    .setName('emojisteal')
    .setDescription('🎭 Kisi bhi emoji ko apne server mein add karo!')
    .addStringOption(opt =>
      opt.setName('emoji')
        .setDescription('Emoji paste karo jise steal karna hai (custom emoji only)')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Naya naam do emoji ko (optional)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuildExpressions) &&
        !interaction.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Permission Nahi Hai!', '`Manage Emojis & Stickers` permission chahiye.')],
        ephemeral: true
      });
    }

    const input = interaction.options.getString('emoji');
    const customName = interaction.options.getString('name');

    // Parse emoji — <:name:id> or <a:name:id>
    const match = input.match(/<(a?):(\w+):(\d+)>/);
    if (!match) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Galat Emoji!', 'Sirf **custom server emoji** steal kar sakte ho!\nFormat: `<:name:id>` ya `<a:name:id>`\n\nDefault Discord emojis steal nahi ho sakti.')],
        ephemeral: true
      });
    }

    const animated = match[1] === 'a';
    const emojiName = customName || match[2];
    const emojiId = match[3];
    const ext = animated ? 'gif' : 'png';
    const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}?quality=lossless`;

    await interaction.deferReply();

    try {
      const newEmoji = await interaction.guild.emojis.create({
        attachment: url,
        name: emojiName,
        reason: `[KIKI Emoji Steal] Added by ${interaction.user.tag}`
      });

      const embed = KikiEmbed.purple(
        '🎭 Emoji Steal Successful!',
        `**Emoji added:** ${newEmoji} \`${newEmoji.name}\`\n` +
        `**Type:** ${animated ? 'Animated 🎞️' : 'Static 🖼️'}\n` +
        `**ID:** \`${newEmoji.id}\`\n` +
        `**Use karo:** \`<${animated ? 'a' : ''}:${newEmoji.name}:${newEmoji.id}>\``
      );

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[EMOJI STEAL]', err.message);
      let errMsg = 'Emoji add nahi hua. Possible reasons:\n• Server emoji slots full hain\n• Bot ko **Manage Emojis** permission nahi\n• Emoji already exist karta hai';
      if (err.message.includes('Maximum')) errMsg = '❌ Server mein **emoji slots full** hain! Pehle koi purana emoji delete karo.';
      return interaction.editReply({
        embeds: [KikiEmbed.error('Emoji Steal Failed!', errMsg)]
      });
    }
  },

  // ── Prefix Command ────────────────────────────────────────────
  name: 'emojisteal',
  aliases: ['esteal', 'stealemoji', 'addemoji', 'ea'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuildExpressions) &&
        !message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
      return message.reply({ embeds: [KikiEmbed.error('Permission Nahi!', '`Manage Emojis` permission chahiye.')] });
    }

    const input = args[0];
    if (!input) {
      return message.reply({
        embeds: [KikiEmbed.purple('🎭 Emoji Steal', '**Usage:** `&emojisteal <emoji> [naam]`\n**Example:** `&emojisteal :coolEmoji: mynewemoji`\n**Aliases:** `&esteal`, `&stealemoji`, `&addemoji`')]
      });
    }

    const match = input.match(/<(a?):(\w+):(\d+)>/);
    if (!match) {
      return message.reply({
        embeds: [KikiEmbed.error('Galat Emoji!', 'Sirf **custom server emoji** steal kar sakte ho!\nExample: `&esteal <:pepe:123456789>`')]
      });
    }

    const animated = match[1] === 'a';
    const emojiName = args[1] || match[2];
    const emojiId = match[3];
    const ext = animated ? 'gif' : 'png';
    const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}?quality=lossless`;

    const msg = await message.reply({ embeds: [KikiEmbed.purple('🎭 Stealing Emoji...', 'Ruk, emoji add ho raha hai...')] });

    try {
      const newEmoji = await message.guild.emojis.create({
        attachment: url,
        name: emojiName,
        reason: `[KIKI Emoji Steal] Added by ${message.author.tag}`
      });

      const embed = KikiEmbed.purple(
        '🎭 Emoji Steal Successful!',
        `**Emoji added:** ${newEmoji} \`${newEmoji.name}\`\n` +
        `**Type:** ${animated ? 'Animated 🎞️' : 'Static 🖼️'}\n` +
        `**ID:** \`${newEmoji.id}\`\n` +
        `**Use karo:** \`<${animated ? 'a' : ''}:${newEmoji.name}:${newEmoji.id}>\``
      );

      return msg.edit({ embeds: [embed] });
    } catch (err) {
      console.error('[EMOJI STEAL]', err.message);
      let errMsg = 'Emoji add nahi hua!\n• Server emoji slots full hain\n• Bot ko Manage Emojis permission nahi';
      if (err.message.includes('Maximum')) errMsg = '❌ Server mein **emoji slots full** hain! Pehle koi purana emoji delete karo.';
      return msg.edit({ embeds: [KikiEmbed.error('Emoji Steal Failed!', errMsg)] });
    }
  }
};
