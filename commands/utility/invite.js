// KIKI Bot - Bot Invite & Add to Server Command
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const config = require('../../config.js');

function buildInviteResponse(client) {
  const inviteUrl = KIKI.getBotInviteUrl(client.user?.id);
  const serverCount = client.guilds.cache.size;
  const userCount = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);

  const embed = KikiEmbed.build({
    title: '🔮 Invite KIKI • Gothic Discord Engine',
    description:
      `**KIKI ko apne kisi bhi Discord server me add karein!** 💜\n\n` +
      `✨ **2 Aasan Tarike (Easy Ways to Add):**\n` +
      `1️⃣ **Direct Button:** Niche diye gaye **"➕ Add KIKI to Server"** button par click karein.\n` +
      `2️⃣ **Bot Bio / Profile:** Discord me meri profile/avatar par click karein aur direct blue **"Add App"** button dabayein!\n\n` +
      `🛡️ **Key Server Features Included:**\n` +
      `• **Master Anti-Nuke:** 16+ Live Defense Shields (Anti-Bot, Anti-Raid, Anti-Nuke)\n` +
      `• **Multi-Server Isolation:** Har server ke apne alag channels aur roles (zero conflict)\n` +
      `• **Automatic Self-Healing:** 5 Auto-created log channels aur 10 Level roles (5-50)\n` +
      `• **Voice Master:** Temporary dynamic voice channels control panel ke sath\n` +
      `• **Voice & Chat Leveling:** Active XP tracking aur auto level roles\n\n` +
      `📊 **Active Network:** Serving **${serverCount}** servers & **${userCount.toLocaleString()}** users.`,
    color: config.COLORS.PRIMARY || 0x9B59B6,
    footer: { text: `KIKI v${config.BOT_VERSION} • Gothic Purple Utility Bot` },
    timestamp: true
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('➕ Add KIKI to Server')
      .setStyle(ButtonStyle.Link)
      .setURL(inviteUrl),
    new ButtonBuilder()
      .setLabel('🔮 Command Library (1,114+)')
      .setStyle(ButtonStyle.Link)
      .setURL(inviteUrl)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('🔮 Get KIKI Bot invite link to add to any server'),

  category: 'utility',

  async execute(interaction, client) {
    const response = buildInviteResponse(client);
    await interaction.reply(response);
  },

  name: 'invite',
  aliases: ['botinvite', 'addbot', 'join', 'inv', 'kikiinvite'],
  async run(message, args, client) {
    const response = buildInviteResponse(client);
    await message.reply(response);
  }
};
