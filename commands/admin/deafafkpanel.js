// KIKI Bot - Interactive Deaf AFK Voice Mover Setup Panel with Member & Role Bypass
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const DeafMover = require('../../utils/deafMover.js');
const config = require('../../config.js');
const KikiEmojis = require('../../utils/emojis.js');

// In-memory staged target channels
const stagedChannels = new Map();

function buildPanelEmbed(guild, stagedChannelId = null, notice = null) {
  const cfg = KIKI.loadConfig();
  const gData = cfg.guilds?.[guild.id] || {};
  const isMoverOn = gData.deaf_mover_enabled ?? (cfg.deaf_mover_enabled === true);
  const targetChannelId = gData.deaf_afk_channel_id || (guild.channels.cache.has(cfg.deaf_afk_channel_id) ? cfg.deaf_afk_channel_id : guild.afkChannelId);
  const targetChannel = targetChannelId ? guild.channels.cache.get(targetChannelId) : null;
  const stagedChannel = stagedChannelId ? guild.channels.cache.get(stagedChannelId) : null;

  const bypassUsers = Array.isArray(gData.afk_bypass_users) ? gData.afk_bypass_users : [];
  const bypassRoles = Array.isArray(gData.afk_bypass_roles) ? gData.afk_bypass_roles : [];

  let bypassUsersDisplay = '`None (Sabhi deaf members move honge)`';
  if (bypassUsers.length > 0) {
    bypassUsersDisplay = bypassUsers.map(id => `<@${id}>`).join(', ');
  }

  let bypassRolesDisplay = '`None`';
  if (bypassRoles.length > 0) {
    bypassRolesDisplay = bypassRoles.map(id => `<@&${id}>`).join(', ');
  }

  const botMember = guild.members.me;
  const hasMovePerm = botMember?.permissions.has(PermissionFlagsBits.MoveMembers);

  let targetDisplay = '`🔴 Not Configured (No channel selected)`';
  if (targetChannel) {
    targetDisplay = `${targetChannel.toString()} (\`${targetChannel.name}\` • ID: \`${targetChannel.id}\`)`;
  } else if (targetChannelId) {
    targetDisplay = `\`⚠️ Channel ID (${targetChannelId}) server me nahi mila\``;
  }

  let description =
    `**Automatic Inactive/Deaf Voice Mover Engine**\n\n` +
    `Agar koi member kisi Voice Channel me **10 minute se zyada deaf** hokar baitha rahega, toh bot use automatically configured AFK channel me move kar dega!\n\n` +
    `⚙️ **Current Settings:**\n` +
    `• 🚀 **Engine Status:** ${isMoverOn ? '🟢 `RUNNING & MONITORING`' : '🔴 `STOPPED / DISABLED`'}\n` +
    `• 💤 **Target AFK Voice Channel:** ${targetDisplay}\n` +
    `• ⏱️ **Deaf Inactivity Threshold:** \`10 Minutes (600 seconds)\`\n` +
    `• 🤖 **Bot Move Permission:** ${hasMovePerm ? '🟢 `Allowed (Move Members: OK)`' : '🔴 `Missing MoveMembers Permission!`'}\n` +
    `• 👥 **Currently Monitored Deaf Members:** \`${DeafMover.getTrackedCount()} members\`\n` +
    (stagedChannel ? `• 🟡 **Selected Staged Channel:** ${stagedChannel.toString()} *(Click "🚀 Run & Save Engine" button to activate!)*\n` : '') +
    `\n🛡️ **AFK Bypass / Whitelist (Deaf hone par bhi VAHI rahenge):**\n` +
    `• 👤 **Exempt Members:** ${bypassUsersDisplay}\n` +
    `• 🏷️ **Exempt Roles:** ${bypassRolesDisplay}\n` +
    (!hasMovePerm ? '\n⚠️ **Warning:** KIKI ke paas **Move Members** permission nahi hai! Server Settings > Roles me KIKI ko Move Members permission dein.\n' : '') +
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `**⚡ Setup & Control Kaise Karein?**\n` +
    `1️⃣ **Step 1:** Voice Channel Dropdown se target AFK channel chunein.\n` +
    `2️⃣ **Step 2 (Bypass Selection):** Dropdown se un members ya roles ko select karein jo **deaf hone ke baad bhi AFK na jayein**.\n` +
    `3️⃣ **Step 3:** **"🚀 Run & Save Engine"** button click karke mover engine activate karein.\n` +
    `4️⃣ **"⚡ Scan & Move Now"** button se turant live test karein.`;

  if (notice) {
    description = `${notice}\n\n` + description;
  }

  const embed = KikiEmbed.build({
    title: `${KikiEmojis.SPARKLE} KIKI • Deaf AFK Voice Mover & Bypass Panel ${KikiEmojis.FIRE}`,
    description: `${KikiEmojis.header()}\n\n` + description,
    color: config.COLORS.GOLD || 0xF1C40F,
    footer: { text: `Deaf AFK Mover Engine • KIKI v${config.BOT_VERSION}` }
  });

  return embed;
}

function buildPanelComponents(hasStaged = false) {
  // Row 1: Voice Channel Select Menu
  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId('dm_channel_select')
    .setPlaceholder('💤 Step 1: Target AFK Voice Channel chunein...')
    .setChannelTypes([ChannelType.GuildVoice]);
  const row1 = new ActionRowBuilder().addComponents(channelSelect);

  // Row 2: User Bypass Select Menu (Members who should stay in VC even when deaf)
  const userSelect = new UserSelectMenuBuilder()
    .setCustomId('dm_user_bypass_select')
    .setPlaceholder('🛡️ Step 2: Member chunein jo deaf hone par bhi AFK na jaye...')
    .setMinValues(1)
    .setMaxValues(10);
  const row2 = new ActionRowBuilder().addComponents(userSelect);

  // Row 3: Role Bypass Select Menu (Roles whose members should stay in VC even when deaf)
  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId('dm_role_bypass_select')
    .setPlaceholder('🏷️ Step 3: Role chunein jiske members deaf hone par bhi AFK na jaye...')
    .setMinValues(1)
    .setMaxValues(5);
  const row3 = new ActionRowBuilder().addComponents(roleSelect);

  // Row 4: Control Buttons with Animated Custom Emojis
  const runBtn = new ButtonBuilder()
    .setCustomId('dm_btn_run')
    .setLabel('Run & Save Engine')
    .setStyle(ButtonStyle.Success)
    .setEmoji(KikiEmojis.btn('check'));

  const stopBtn = new ButtonBuilder()
    .setCustomId('dm_btn_stop')
    .setLabel('Stop Mover')
    .setStyle(ButtonStyle.Danger)
    .setEmoji(KikiEmojis.btn('cross'));

  const scanBtn = new ButtonBuilder()
    .setCustomId('dm_btn_scan')
    .setLabel('Scan & Move Now')
    .setStyle(ButtonStyle.Primary)
    .setEmoji(KikiEmojis.btn('fire'));

  const clearBypassBtn = new ButtonBuilder()
    .setCustomId('dm_btn_clear_bypass')
    .setLabel('Clear Bypass')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(KikiEmojis.btn('trash'));

  const refreshBtn = new ButtonBuilder()
    .setCustomId('dm_btn_refresh')
    .setLabel('Refresh')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(KikiEmojis.btn('loading'));

  const row4 = new ActionRowBuilder().addComponents(runBtn, stopBtn, scanBtn, clearBypassBtn, refreshBtn);

  return [row1, row2, row3, row4];
}

module.exports = {
  buildPanelEmbed,
  buildPanelComponents,

  data: new SlashCommandBuilder()
    .setName('deafafkpanel')
    .setDescription('💤 Open Deaf AFK Voice Mover & Bypass Panel (Select who never moves to AFK VC)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf **Server Owner** ya **Whitelisted members** is panel ko use kar sakte hain!')],
        ephemeral: true
      });
    }

    const embed = buildPanelEmbed(interaction.guild);
    const components = buildPanelComponents(false);

    await interaction.reply({ embeds: [embed], components });
  },

  name: 'deafafkpanel',
  aliases: ['afkpanel', 'deafafk', 'vcafk', 'afkmover', 'deafmover', 'deafpanel', 'vcafkpanel'],
  async run(message, args, client) {
    if (!KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf **Server Owner** ya **Whitelisted members** is panel ko use kar sakte hain!')]
      });
    }

    const embed = buildPanelEmbed(message.guild);
    const components = buildPanelComponents(false);

    await message.reply({ embeds: [embed], components });
  },

  // ── Component Interaction Handler ─────────────────────────────
  async handleInteraction(interaction, client) {
    const guild = interaction.guild;
    const user = interaction.user;

    if (!guild) return;

    if (!KIKI.isSafe(guild, user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Aapke paas is panel ko control karne ki permission nahi hai!')],
        ephemeral: true
      });
    }

    const customId = interaction.customId;

    // 1. Channel Selected in Menu
    if (interaction.isChannelSelectMenu() && customId === 'dm_channel_select') {
      const selectedChannelId = interaction.values[0];
      const channel = guild.channels.cache.get(selectedChannelId);

      if (!channel || channel.type !== ChannelType.GuildVoice) {
        return interaction.reply({
          embeds: [KikiEmbed.error('Channel Error', 'Please ek valid Voice Channel select karein!')],
          ephemeral: true
        });
      }

      stagedChannels.set(guild.id, channel.id);

      const notice = `🟡 **Target Channel Selected:** ${channel.toString()} (\`${channel.name}\`)!\nAb niche diye gaye **"🚀 Run & Save Engine"** button par click karein taaki mover start ho jaye.`;
      const embed = buildPanelEmbed(guild, channel.id, notice);
      const components = buildPanelComponents(true);

      await interaction.update({ embeds: [embed], components });
      return;
    }

    // 2. Member Bypass Selected in Menu
    if (interaction.isUserSelectMenu() && customId === 'dm_user_bypass_select') {
      const selectedUserIds = interaction.values;
      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};

      const current = new Set(Array.isArray(cfg.guilds[guild.id].afk_bypass_users) ? cfg.guilds[guild.id].afk_bypass_users : []);
      for (const uid of selectedUserIds) current.add(uid);
      cfg.guilds[guild.id].afk_bypass_users = Array.from(current);
      KIKI.saveConfig(cfg);

      const notice = `🛡️ **AFK Bypass Members Added:** ${selectedUserIds.map(id => `<@${id}>`).join(', ')}\nYe members ab **deaf hone ke baad bhi AFK VC me nahi jayenge**, vahi rahenge!`;
      const stagedId = stagedChannels.get(guild.id);
      const embed = buildPanelEmbed(guild, stagedId, notice);
      const components = buildPanelComponents(Boolean(stagedId));

      await interaction.update({ embeds: [embed], components });
      return;
    }

    // 3. Role Bypass Selected in Menu
    if (interaction.isRoleSelectMenu() && customId === 'dm_role_bypass_select') {
      const selectedRoleIds = interaction.values;
      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};

      const current = new Set(Array.isArray(cfg.guilds[guild.id].afk_bypass_roles) ? cfg.guilds[guild.id].afk_bypass_roles : []);
      for (const rid of selectedRoleIds) current.add(rid);
      cfg.guilds[guild.id].afk_bypass_roles = Array.from(current);
      KIKI.saveConfig(cfg);

      const notice = `🏷️ **AFK Bypass Roles Added:** ${selectedRoleIds.map(id => `<@&${id}>`).join(', ')}\nIn roles ke sabhi members ab **deaf hone ke baad bhi AFK VC me nahi jayenge**!`;
      const stagedId = stagedChannels.get(guild.id);
      const embed = buildPanelEmbed(guild, stagedId, notice);
      const components = buildPanelComponents(Boolean(stagedId));

      await interaction.update({ embeds: [embed], components });
      return;
    }

    // 4. Buttons
    if (interaction.isButton()) {
      if (customId === 'dm_btn_run') {
        const stagedId = stagedChannels.get(guild.id);
        const cfg = KIKI.loadConfig();
        const targetChannelId = stagedId || cfg.deaf_afk_channel_id;

        if (!targetChannelId) {
          return interaction.reply({
            embeds: [KikiEmbed.warn('Channel Missing', 'Pehle Step 1 me **Voice Channel Dropdown** se target AFK channel select karein!')],
            ephemeral: true
          });
        }

        const targetChannel = guild.channels.cache.get(targetChannelId) ||
          await guild.channels.fetch(targetChannelId).catch(() => null);

        if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) {
          stagedChannels.delete(guild.id);
          return interaction.reply({
            embeds: [KikiEmbed.error('Channel Error', 'Selected channel server me valid Voice Channel nahi hai!')],
            ephemeral: true
          });
        }

        // Save & Activate (Isolated per Guild)
        if (!cfg.guilds) cfg.guilds = {};
        if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
        cfg.guilds[guild.id].deaf_mover_enabled = true;
        cfg.guilds[guild.id].deaf_afk_channel_id = targetChannel.id;
        cfg.guilds[guild.id].deaf_timeout_minutes = 10;
        if (!cfg.deaf_afk_channel_id) {
          cfg.deaf_mover_enabled = true;
          cfg.deaf_afk_channel_id = targetChannel.id;
          cfg.deaf_timeout_minutes = 10;
        }
        KIKI.saveConfig(cfg);
        stagedChannels.delete(guild.id);

        // Run immediate scan
        const scanRes = await DeafMover.checkAndMove(client, guild).catch(() => ({ moved: 0 }));

        let notice = `✅ **Deaf AFK Mover Successfully RUNNING & SAVED!**\nTarget AFK Channel: ${targetChannel.toString()} (\`${targetChannel.name}\`)\n• Jo members bypass list me nahi hain, wo 10 minute deaf rehne par auto-move honge!`;
        if (scanRes.moved > 0) {
          notice += `\n⚡ **Instant Action:** ${scanRes.moved} already deaf member(s) were moved right now!`;
        }

        const embed = buildPanelEmbed(guild, null, notice);
        const components = buildPanelComponents(false);

        await interaction.update({ embeds: [embed], components });
        return;
      }

      if (customId === 'dm_btn_stop') {
        const cfg = KIKI.loadConfig();
        if (!cfg.guilds) cfg.guilds = {};
        if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
        cfg.guilds[guild.id].deaf_mover_enabled = false;
        KIKI.saveConfig(cfg);
        stagedChannels.delete(guild.id);

        const notice = '🚫 **Deaf AFK Mover STOPPED!**\nDeafened members ko move karna temporarily band kar diya gaya hai.';
        const embed = buildPanelEmbed(guild, null, notice);
        const components = buildPanelComponents(false);

        await interaction.update({ embeds: [embed], components });
        return;
      }

      if (customId === 'dm_btn_scan') {
        const res = await DeafMover.checkAndMove(client, guild).catch(() => ({ moved: 0, checked: 0 }));
        return interaction.reply({
          embeds: [KikiEmbed.success(
            'Instant Scan Complete ⚡',
            `**Voice States Checked:** \`${res.checked}\`\n` +
            `**Deaf Members Moved:** \`${res.moved}\`\n\n` +
            `*(Bypassed members will never be moved even if deaf).*`
          )],
          ephemeral: true
        });
      }

      if (customId === 'dm_btn_clear_bypass') {
        const cfg = KIKI.loadConfig();
        if (cfg.guilds?.[guild.id]) {
          cfg.guilds[guild.id].afk_bypass_users = [];
          cfg.guilds[guild.id].afk_bypass_roles = [];
          KIKI.saveConfig(cfg);
        }
        const notice = '🗑️ **AFK Bypass List Reset!** Sabhi bypass users aur roles clear kar diye gaye hain.';
        const stagedId = stagedChannels.get(guild.id);
        const embed = buildPanelEmbed(guild, stagedId, notice);
        const components = buildPanelComponents(Boolean(stagedId));

        await interaction.update({ embeds: [embed], components });
        return;
      }

      if (customId === 'dm_btn_refresh') {
        const stagedId = stagedChannels.get(guild.id);
        const embed = buildPanelEmbed(guild, stagedId, '🔃 Panel refreshed!');
        const components = buildPanelComponents(Boolean(stagedId));

        await interaction.update({ embeds: [embed], components });
        return;
      }
    }
  }
};
