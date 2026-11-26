// KIKI Bot - Member Leave & Goodbye Configuration Panel
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const config = require('../../config.js');
const KikiEmojis = require('../../utils/emojis.js');

const GOODBYE_GIFS = [
  'https://media.giphy.com/media/l3vR4CdLInXOhr3rO/giphy.gif',
  'https://media.giphy.com/media/ROF8OQvDmxytW/giphy.gif',
  'https://media.giphy.com/media/xT0GqgeTVaAdWZD1uw/giphy.gif',
  'https://media.giphy.com/media/7SF5scGB2AFrgsXP63/giphy.gif'
];

function buildLeaveCard(guild, user, memberDetails = {}) {
  const gif = GOODBYE_GIFS[Math.floor(Math.random() * GOODBYE_GIFS.length)];
  const joinedAt = memberDetails.joinedTimestamp
    ? `<t:${Math.floor(memberDetails.joinedTimestamp / 1000)}:R>`
    : `<t:${Math.floor((Date.now() - 86400000 * 7) / 1000)}:R>`;

  const stayDuration = memberDetails.joinedTimestamp && KIKI.formatDuration
    ? KIKI.formatDuration(Date.now() - memberDetails.joinedTimestamp)
    : '7d 14h';

  const userTag = user.tag || user.username || 'Member';
  const avatarUrl = user.displayAvatarURL ? user.displayAvatarURL({ dynamic: true }) : null;

  const embed = KikiEmbed.build({
    title: '🥀 Tusi Jaa Rahe Ho? Please Tusi Na Jaao...! 🥺💔',
    description:
      `🖤 **${user.toString()}** ne server chhod diya... 🥀\n\n` +
      `> *“Tusi jaa rahe ho? Please tusi na jaao...! 🥺💔\n` +
      `> Aapke bina hamara gothic realm bilkul soona ho gaya hai... ✨”*\n\n` +
      `${KikiEmojis.goodbyeBanner()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    color: 0x9B59B6,
    thumbnail: avatarUrl,
    image: gif,
    fields: [
      { name: '👤 Ex-Member', value: `${userTag} (\`${user.id}\`)`, inline: true },
      { name: '📊 Remaining Shadows', value: `#${guild.memberCount} members`, inline: true },
      { name: '📅 Joined Server', value: `${joinedAt} (Stayed ${stayDuration})`, inline: true },
      { name: '🚪 Departure Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
    ],
    footer: { text: `🥀 KIKI Gothic Goodbye System • Farewell from ${guild.name}` }
  });

  return {
    content: `${KikiEmojis.goodbyeBanner()}\n**Tusi jaa rahe ho? Please tusi na jaao...!** ${user.toString()} ${KikiEmojis.HEART}`,
    embeds: [embed]
  };
}

function buildPanelEmbed(guild = null, statusNotice = null) {
  const cfg = KIKI.loadConfig();
  const gData = (guild ? cfg.guilds?.[guild.id] : null) || {};
  const channelId = gData.leave_channel_id || (guild?.channels.cache.has(cfg.leave_channel_id) ? cfg.leave_channel_id : null);
  const isEnabled = gData.leave_enabled !== undefined ? gData.leave_enabled : (cfg.leave_enabled !== false);

  const channelText = channelId ? `<#${channelId}> (\`${channelId}\`)` : '`🔴 Not Configured (No channel set)`';

  let description =
    `${KikiEmojis.header()}\n\n` +
    `**Member Leave & Animated Goodbye Configuration**\n\n` +
    `Jab koi member server chhodta hai, bot automatically Leave Channel me emotional animated card bhejega!\n\n` +
    `⚙️ **Current Settings:**\n` +
    `• 🚪 **Leave Log Channel:** ${channelText}\n` +
    `• 🔔 **Goodbye Cards:** ${isEnabled ? '🟢 `Enabled (Cards will be sent)`' : '🔴 `Disabled (Silent leave)`'}\n` +
    `• 🥀 **Custom Message:** *“Tusi jaa rahe ho? Please tusi na jaao...! 🥺💔”*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `**⚡ Setup Kaise Karein?**\n` +
    `1️⃣ Niche diye gaye **Channel Selector** se wo channel chunein jahan leave message aana chahiye.\n` +
    `2️⃣ **🧪 Test Goodbye Card** button se live animated card ka preview dekhein!\n` +
    `3️⃣ Buttons se Goodbye notifications ON/OFF karein.`;

  if (statusNotice) {
    description = `${statusNotice}\n\n` + description;
  }

  return KikiEmbed.build({
    title: `${KikiEmojis.BUTTERFLY} KIKI • Member Leave Setup Panel ${KikiEmojis.SPARKLE}`,
    description,
    color: 0x9B59B6,
    footer: { text: `Leave & Goodbye Engine • KIKI v${config.BOT_VERSION}` }
  });
}

function buildPanelComponents(guild = null) {
  const cfg = KIKI.loadConfig();
  const gData = (guild ? cfg.guilds?.[guild.id] : null) || {};
  const isEnabled = gData.leave_enabled !== undefined ? gData.leave_enabled : (cfg.leave_enabled !== false);

  // Row 1: Channel Selector
  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId('lp_channel_select')
    .setPlaceholder('🚪 Step 1: Member Leave / Goodbye Channel select karein...')
    .setChannelTypes([ChannelType.GuildText]);
  const row1 = new ActionRowBuilder().addComponents(channelSelect);

  // Row 2: Control Buttons with Animated Custom Emojis
  const toggleBtn = new ButtonBuilder()
    .setCustomId('lp_btn_toggle')
    .setLabel(isEnabled ? 'Disable Cards' : 'Enable Cards')
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success)
    .setEmoji(isEnabled ? KikiEmojis.btn('cross') : KikiEmojis.btn('check'));

  const testBtn = new ButtonBuilder()
    .setCustomId('lp_btn_test')
    .setLabel('Test Goodbye Card')
    .setStyle(ButtonStyle.Primary)
    .setEmoji(KikiEmojis.btn('heart'));

  const clearBtn = new ButtonBuilder()
    .setCustomId('lp_btn_clear')
    .setLabel('Unset Channel')
    .setStyle(ButtonStyle.Danger)
    .setEmoji(KikiEmojis.btn('cross'));

  const refreshBtn = new ButtonBuilder()
    .setCustomId('lp_btn_refresh')
    .setLabel('Refresh')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(KikiEmojis.btn('loading'));

  const row2 = new ActionRowBuilder().addComponents(toggleBtn, testBtn, clearBtn, refreshBtn);

  return [row1, row2];
}

module.exports = {
  buildLeaveCard,
  buildPanelEmbed,
  buildPanelComponents,

  data: new SlashCommandBuilder()
    .setName('leavepanel')
    .setDescription('🚪 Member Leave & Goodbye Setup Panel (Select channel & customize)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf Server Owner aur Whitelisted members Leave Panel open kar sakte hain!')],
        ephemeral: true
      });
    }

    const embed = buildPanelEmbed(interaction.guild);
    const components = buildPanelComponents(interaction.guild);
    await interaction.reply({ embeds: [embed], components });
  },

  name: 'leavepanel',
  aliases: ['goodbyepanel', 'leaveconfig', 'lp'],

  async run(message, args, client) {
    if (!KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf Server Owner aur Whitelisted members Leave Panel open kar sakte hain!')]
      });
    }

    const sub = args[0]?.toLowerCase();

    // CLI Subcommands: channel / setchannel
    if (sub === 'channel' || sub === 'setchannel') {
      const ch = message.mentions?.channels?.first?.() || (args[1] ? message.guild.channels.cache.get(args[1].replace(/[<#>]/g, '')) : null);
      if (!ch) return message.reply('Channel mention karein! Jaise: `&leavepanel channel #leave-logs`');

      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[message.guild.id]) cfg.guilds[message.guild.id] = {};
      cfg.guilds[message.guild.id].leave_channel_id = ch.id;
      cfg.guilds[message.guild.id].leave_enabled = true;
      if (!cfg.leave_channel_id) cfg.leave_channel_id = ch.id;
      KIKI.saveConfig(cfg);

      return message.reply({
        embeds: [KikiEmbed.success('Leave Channel Set', `🚪 Member Leave & Goodbye messages ab ${ch.toString()} me bheje jayenge!`)]
      });
    }

    // CLI Subcommands: toggle
    if (sub === 'toggle') {
      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[message.guild.id]) cfg.guilds[message.guild.id] = {};
      const current = cfg.guilds[message.guild.id].leave_enabled !== undefined ? cfg.guilds[message.guild.id].leave_enabled : (cfg.leave_enabled !== false);
      cfg.guilds[message.guild.id].leave_enabled = !current;
      KIKI.saveConfig(cfg);

      return message.reply({
        embeds: [KikiEmbed.success('Leave Cards Toggled', `🔔 Goodbye cards ab **${!current ? 'ENABLED' : 'DISABLED'}** hain.`)]
      });
    }

    // CLI Subcommands: test
    if (sub === 'test') {
      const card = buildLeaveCard(message.guild, message.author, { joinedTimestamp: message.member?.joinedTimestamp });
      const targetChannel = KIKI.getGuildChannel(message.guild, 'leave_channel_id') || message.channel;
      await targetChannel.send(card);
      return message.reply({
        embeds: [KikiEmbed.success('Test Card Sent', `🧪 Animated Goodbye preview card ${targetChannel.toString()} me bhej diya gaya hai!`)]
      });
    }

    // Default: Open Interactive UI Panel
    const embed = buildPanelEmbed(message.guild);
    const components = buildPanelComponents(message.guild);
    await message.channel.send({ embeds: [embed], components });
  },

  // ── Interaction Handler (Select Menus, Buttons) ───────────────────
  async handleInteraction(interaction, client) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf Server Owner aur Whitelisted members ye controls change kar sakte hain!')],
        ephemeral: true
      });
    }

    const { customId, guild } = interaction;
    const cfg = KIKI.loadConfig();
    if (!cfg.guilds) cfg.guilds = {};
    if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};

    // 1. Channel Select Menu
    if (customId === 'lp_channel_select' && interaction.isChannelSelectMenu()) {
      const selectedChannelId = interaction.values[0];
      cfg.guilds[guild.id].leave_channel_id = selectedChannelId;
      cfg.guilds[guild.id].leave_enabled = true;
      if (!cfg.leave_channel_id) cfg.leave_channel_id = selectedChannelId;
      KIKI.saveConfig(cfg);

      const notice = `✅ **Channel Bound!** Member Leave messages ab <#${selectedChannelId}> me aayenge.`;
      const embed = buildPanelEmbed(guild, notice);
      const components = buildPanelComponents(guild);
      return interaction.update({ embeds: [embed], components });
    }

    // 2. Button: Toggle Cards
    if (customId === 'lp_btn_toggle') {
      const current = cfg.guilds[guild.id].leave_enabled !== undefined ? cfg.guilds[guild.id].leave_enabled : (cfg.leave_enabled !== false);
      cfg.guilds[guild.id].leave_enabled = !current;
      KIKI.saveConfig(cfg);

      const notice = `🔔 **Goodbye Cards:** Leave notification cards are now **${!current ? 'ENABLED' : 'DISABLED'}**.`;
      const embed = buildPanelEmbed(guild, notice);
      const components = buildPanelComponents(guild);
      return interaction.update({ embeds: [embed], components });
    }

    // 3. Button: Test Card Preview
    if (customId === 'lp_btn_test') {
      const targetChannel = KIKI.getGuildChannel(guild, 'leave_channel_id') || interaction.channel;
      const card = buildLeaveCard(guild, interaction.user, { joinedTimestamp: interaction.member?.joinedTimestamp });
      await targetChannel.send(card).catch(() => {});

      return interaction.reply({
        embeds: [KikiEmbed.success('Test Card Dispatched 🧪', `Animated Goodbye card ka test preview ${targetChannel.toString()} me bhej diya gaya hai!`)],
        ephemeral: true
      });
    }

    // 4. Button: Unset Channel
    if (customId === 'lp_btn_clear') {
      cfg.guilds[guild.id].leave_channel_id = null;
      KIKI.saveConfig(cfg);

      const notice = '🚫 Member leave announcement channel unset kar diya gaya hai.';
      const embed = buildPanelEmbed(guild, notice);
      const components = buildPanelComponents(guild);
      return interaction.update({ embeds: [embed], components });
    }

    // 5. Button: Refresh
    if (customId === 'lp_btn_refresh') {
      const embed = buildPanelEmbed(guild, '🔃 Panel refreshed!');
      const components = buildPanelComponents(guild);
      return interaction.update({ embeds: [embed], components });
    }
  }
};
