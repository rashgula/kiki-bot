// KIKI Bot - Chat Leveling Configuration Panel
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

function buildPanelEmbed(statusNotice = null) {
  const cfg = KIKI.loadConfig();
  const channelId = cfg.chat_level_channel_id;
  const isAlertsOn = cfg.chat_level_alerts !== false;
  const isXpOn = cfg.chat_xp_enabled !== false;

  const channelText = channelId ? `<#${channelId}> (\`${channelId}\`)` : '`🔴 Not Configured (No channel set)`';

  let description =
    `**Text Chat Activity & Leveling Configuration**\n\n` +
    `Members jab text channels me messages bhejte hain, bot unhe automatically Chat XP deta hai aur unka Chat Level badhta hai!\n\n` +
    `*(Note: Chat levels me koi role nahi milta — sirf members ki chat ranking aur level track hota hai).* \n\n` +
    `⚙️ **Current Settings:**\n` +
    `• 📢 **Level-Up Announce Channel:** ${channelText}\n` +
    `• 🔔 **Level-Up Notification Cards:** ${isAlertsOn ? '🟢 `Enabled (Level up hone par card send hoga)`' : '🔴 `Disabled (Silent level-up)`'}\n` +
    `• 💬 **Chat XP Engine Status:** ${isXpOn ? '🟢 `Active (15-25 XP per msg, 45s cooldown)`' : '🔴 `Paused`'}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `**⚡ Setup Kaise Karein?**\n` +
    `1️⃣ Niche diye gaye **Channel Selector** se wo channel chunein jahan Chat Level-Up card aana chahiye.\n` +
    `2️⃣ Buttons se Level-Up cards aur Chat XP on/off karein.\n` +
    `3️⃣ Members \`&chatrank\` se apna chat level dekh sakte hain!`;

  if (statusNotice) {
    description = `${statusNotice}\n\n` + description;
  }

  const embed = KikiEmbed.build({
    title: '💬 KIKI • Chat Leveling Setup Panel',
    description,
    color: config.COLORS.TEAL || 0x1ABC9C,
    footer: { text: `Chat Leveling Engine • KIKI v${config.BOT_VERSION}` }
  });

  return embed;
}

function buildPanelComponents() {
  const cfg = KIKI.loadConfig();

  // Row 1: Channel Selector
  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId('cl_channel_select')
    .setPlaceholder('📢 Step 1: Chat Level-Up Announce Channel select karein...')
    .setChannelTypes([ChannelType.GuildText]);
  const row1 = new ActionRowBuilder().addComponents(channelSelect);

  // Row 2: Control Buttons
  const alertBtn = new ButtonBuilder()
    .setCustomId('cl_btn_alerts')
    .setLabel(cfg.chat_level_alerts !== false ? 'Disable Alerts' : 'Enable Alerts')
    .setStyle(cfg.chat_level_alerts !== false ? ButtonStyle.Danger : ButtonStyle.Success)
    .setEmoji('🔔');

  const xpBtn = new ButtonBuilder()
    .setCustomId('cl_btn_xp')
    .setLabel(cfg.chat_xp_enabled !== false ? 'Pause Chat XP' : 'Resume Chat XP')
    .setStyle(cfg.chat_xp_enabled !== false ? ButtonStyle.Secondary : ButtonStyle.Success)
    .setEmoji('⚡');

  const clearBtn = new ButtonBuilder()
    .setCustomId('cl_btn_clear')
    .setLabel('Unset Channel')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('🚫');

  const refreshBtn = new ButtonBuilder()
    .setCustomId('cl_btn_refresh')
    .setLabel('Refresh')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('🔃');

  const row2 = new ActionRowBuilder().addComponents(alertBtn, xpBtn, clearBtn, refreshBtn);

  return [row1, row2];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chatlevelpanel')
    .setDescription('💬 Open Chat Leveling setup panel (Configure announce channel & alerts)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf Server Owner aur Whitelisted members Chat Level Panel open kar sakte hain!')],
        ephemeral: true
      });
    }

    const embed = buildPanelEmbed();
    const components = buildPanelComponents();
    await interaction.reply({ embeds: [embed], components });
  },

  name: 'chatlevelpanel',
  aliases: ['chatlevelsetup', 'chatlevels', 'clpanel', 'setchatlevels', 'chatpanel'],
  async run(message, args, client) {
    if (!KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf Server Owner aur Whitelisted members Chat Level Panel open kar sakte hain!')]
      });
    }

    const sub = args[0]?.toLowerCase();

    // ── CLI Subcommands ─────────────────────────────────────────────
    if (sub === 'channel' || sub === 'setchannel') {
      const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!ch) return message.reply('Channel mention karein! Jaise: `&chatlevelpanel channel #chat-levels`');

      const cfg = KIKI.loadConfig();
      cfg.chat_level_channel_id = ch.id;
      cfg.chat_level_alerts = true;
      KIKI.saveConfig(cfg);

      return message.reply({
        embeds: [KikiEmbed.success('Chat Level Channel Set', `📢 Chat Level-up announcements ab ${ch.toString()} me bheje jayenge!`)]
      });
    }

    if (sub === 'alerts' || sub === 'toggle') {
      const cfg = KIKI.loadConfig();
      cfg.chat_level_alerts = cfg.chat_level_alerts === false ? true : false;
      KIKI.saveConfig(cfg);

      return message.reply({
        embeds: [KikiEmbed.success('Alerts Toggled', `🔔 Chat Level-up alerts ab **${cfg.chat_level_alerts ? 'ENABLED' : 'DISABLED'}** hain.`)]
      });
    }

    if (sub === 'xp') {
      const cfg = KIKI.loadConfig();
      cfg.chat_xp_enabled = cfg.chat_xp_enabled === false ? true : false;
      KIKI.saveConfig(cfg);

      return message.reply({
        embeds: [KikiEmbed.success('Chat XP Toggled', `⚡ Chat XP tracking ab **${cfg.chat_xp_enabled ? 'ACTIVE' : 'PAUSED'}** hai.`)]
      });
    }

    // Default: Open Interactive UI Panel
    const embed = buildPanelEmbed();
    const components = buildPanelComponents();
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

    const { customId } = interaction;
    const cfg = KIKI.loadConfig();

    // 1. Channel Select Menu
    if (customId === 'cl_channel_select' && interaction.isChannelSelectMenu()) {
      const selectedChannelId = interaction.values[0];
      cfg.chat_level_channel_id = selectedChannelId;
      cfg.chat_level_alerts = true;
      KIKI.saveConfig(cfg);

      const notice = `✅ **Channel Bound!** Chat level-up notifications ab <#${selectedChannelId}> me aayenge.`;
      const embed = buildPanelEmbed(notice);
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }

    // 2. Button: Toggle Alerts
    if (customId === 'cl_btn_alerts') {
      cfg.chat_level_alerts = cfg.chat_level_alerts === false ? true : false;
      KIKI.saveConfig(cfg);

      const notice = `🔔 **Alerts:** Level-up celebration cards are now **${cfg.chat_level_alerts ? 'ENABLED' : 'DISABLED'}**.`;
      const embed = buildPanelEmbed(notice);
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }

    // 3. Button: Toggle Chat XP
    if (customId === 'cl_btn_xp') {
      cfg.chat_xp_enabled = cfg.chat_xp_enabled === false ? true : false;
      KIKI.saveConfig(cfg);

      const notice = `⚡ **Chat XP:** Chat tracking is now **${cfg.chat_xp_enabled ? 'ACTIVE' : 'PAUSED'}**.`;
      const embed = buildPanelEmbed(notice);
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }

    // 4. Button: Unset Channel
    if (customId === 'cl_btn_clear') {
      cfg.chat_level_channel_id = null;
      KIKI.saveConfig(cfg);

      const notice = '🚫 Chat level-up announcement channel unset kar diya gaya hai.';
      const embed = buildPanelEmbed(notice);
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }

    // 5. Button: Refresh
    if (customId === 'cl_btn_refresh') {
      const embed = buildPanelEmbed('🔃 Panel refreshed!');
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }
  }
};
