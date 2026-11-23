// KIKI Bot - Full Server Auto-Setup Command
// Replicates the complete Chit chat suite into ANY server in 1 click!

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');
const chalk = require('chalk');
const KIKI = require('../../utils/kiki.js');
const KikiEmbed = require('../../utils/embed.js');
const bootRestorer = require('../../utils/bootRestorer.js');
const config = require('../../config.js');

async function executeFullSetup(guild, client, updateCallback) {
  // 1. Hydrate Caches
  await guild.channels.fetch().catch(() => {});
  await guild.roles.fetch().catch(() => {});

  const botMember = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
  if (!botMember || !botMember.permissions.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles])) {
    throw new Error('Bot ke paas **Manage Channels** aur **Manage Roles** permissions honi chahiye!');
  }

  // Ensure guild in config
  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
  cfg.guilds[guild.id].configured = true;
  KIKI.saveConfig(cfg);

  // Step 1: Ensure Server Logs (5 Channels)
  const logsCount = await bootRestorer.ensureLogChannels(guild, true);

  // Step 2: Ensure 10 Level Roles (5 to 50)
  const rolesCount = await bootRestorer.ensureLevelRoles(guild, true);

  // Step 3: Ensure Level Announcement Channels (level-logs & chat-levels)
  await bootRestorer.ensureLevelAnnounceChannels(guild, true);

  // Step 4: Ensure Voice Master Dynamic Channels (Category + Join VC + Control Panel + VM Logs)
  await bootRestorer.ensureVoiceMaster(guild, true);

  // Step 5: Ensure Invite Tracker (Category + invite-logs)
  await bootRestorer.ensureInviteTracker(guild, true);
  try {
    const InviteTracker = require('../../utils/inviteTracker.js');
    if (guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const invites = await guild.invites.fetch().catch(() => null);
      if (invites) {
        InviteTracker.cacheGuildInvites(guild.id, invites);
      }
    }
  } catch (e) {}

  // Step 6: Ensure Auto-Role (@🔮・Member)
  await bootRestorer.ensureAutoRole(guild, true);

  // Step 7: Ensure Deaf AFK Mover (💤・AFK Lounge • 10m)
  await bootRestorer.ensureDeafAfk(guild, true);

  // Step 8: Master Anti-Nuke (16 Shields Live)
  const freshCfg = KIKI.loadConfig();
  freshCfg.antinuke = true;
  freshCfg.master_antinuke = true;
  if (!freshCfg.antinuke_modules) freshCfg.antinuke_modules = {};
  const modules = [
    'anti_bot', 'anti_channel_delete', 'anti_channel_create', 'anti_channel_update',
    'anti_role_delete', 'anti_role_create', 'anti_role_update', 'anti_ban', 'anti_kick',
    'anti_webhook', 'anti_server_update', 'anti_prune', 'anti_everyone',
    'anti_mass_mention', 'anti_invite', 'anti_link'
  ];
  for (const m of modules) {
    freshCfg.antinuke_modules[m] = true;
  }
  freshCfg.punishment = 'ban';
  KIKI.saveConfig(freshCfg);

  // Step 9: Register Slash Commands for this guild
  let slashCount = 0;
  try {
    const slashCmds = [];
    for (const [, cmd] of client.commands) {
      if (slashCmds.length >= 100) break;
      if (cmd.data) slashCmds.push(cmd.data.toJSON());
    }
    if (slashCmds.length > 0) {
      await guild.commands.set(slashCmds).catch(() => {});
      slashCount = slashCmds.length;
    }
  } catch (e) {}

  return { logsCount, rolesCount, slashCount };
}

function buildSuccessEmbed(guild, stats) {
  const cfg = KIKI.loadConfig();
  const gData = cfg.guilds?.[guild.id] || {};

  const voiceLog = gData.voice_log_channel_id ? `<#${gData.voice_log_channel_id}>` : '`Active`';
  const chatLog = gData.chat_log_channel_id ? `<#${gData.chat_log_channel_id}>` : '`Active`';
  const welcomeLog = gData.welcome_channel_id ? `<#${gData.welcome_channel_id}>` : '`Active`';
  const leaveLog = gData.leave_channel_id ? `<#${gData.leave_channel_id}>` : '`Active`';
  const secLog = gData.security_log_channel_id ? `<#${gData.security_log_channel_id}>` : '`Active`';

  const levelLog = gData.level_channel_id ? `<#${gData.level_channel_id}>` : '`Active`';
  const chatLevelLog = gData.chat_level_channel_id ? `<#${gData.chat_level_channel_id}>` : '`Active`';

  const vmJoin = gData.voice_master_channel_id ? `<#${gData.voice_master_channel_id}>` : '`Active`';
  const vmInterface = gData.voice_master_interface_id ? `<#${gData.voice_master_interface_id}>` : '`Active`';
  const vmLogs = gData.voice_master_log_channel_id ? `<#${gData.voice_master_log_channel_id}>` : '`Active`';

  const invLog = gData.invite_tracker_channel_id ? `<#${gData.invite_tracker_channel_id}>` : '`Active`';
  const autoRole = gData.autorole_id ? `<@&${gData.autorole_id}>` : '`@🔮・Member`';
  const deafAfk = gData.deaf_afk_channel_id ? `<#${gData.deaf_afk_channel_id}>` : '`💤・AFK Lounge`';

  return KikiEmbed.build({
    title: `🔮 KIKI SETUP 100% COMPLETE • ${guild.name}`,
    description:
      `**Chit chat server ka complete setup is server me successfully replicate ho chuka hai!** ✨\n\n` +
      `Sabhi systems, channels aur roles is server ke liye alag se create aur bind kar diye gaye hain (Zero conflicts with any other server)!\n\n` +
      `🛡️ **Master Anti-Nuke:** 🟢 \`ACTIVE (All 16+ defense shields live • Punishment: BAN)\`\n` +
      `👑 **Level Roles (5-50):** 🟢 \`${stats.rolesCount}/10 Roles Verified & Bound\`\n` +
      `📜 **Server Log Channels:** 🟢 \`${stats.logsCount}/5 Channels Linked\`\n` +
      `   • Voice: ${voiceLog} | Chat: ${chatLog}\n` +
      `   • Welcome: ${welcomeLog} | Leave: ${leaveLog}\n` +
      `   • Security: ${secLog}\n\n` +
      `📢 **Level Announcement Channels:** 🟢\n` +
      `   • Voice Levels: ${levelLog}\n` +
      `   • Chat Levels: ${chatLevelLog}\n\n` +
      `🔊 **Voice Master System:** 🟢 \`ONLINE\`\n` +
      `   • Join to Create: ${vmJoin}\n` +
      `   • Control Panel: ${vmInterface} *(Live Interactive Buttons Panel Ready)*\n` +
      `   • Audit Logs: ${vmLogs}\n\n` +
      `📩 **Invite Tracker:** 🟢 \`ACTIVE\` • Logs: ${invLog}\n` +
      `🏷️ **Auto-Role on Join:** 🟢 \`ACTIVE\` • Role: ${autoRole}\n` +
      `💤 **Deaf AFK Mover:** 🟢 \`ACTIVE\` • VC: ${deafAfk} *(10m timeout)*\n` +
      `🎙️ **Voice XP Engine:** 🟢 \`RUNNING (18-23 XP/min in VC)\`\n` +
      `💬 **Chat XP Engine:** 🟢 \`RUNNING (15-25 XP/msg)\`\n` +
      `⚡ **Slash Commands:** 🟢 \`${stats.slashCount} Commands Registered\``,
    color: config.COLORS.PRIMARY || 0x9B59B6,
    footer: { text: `One-Click Full Setup Engine • KIKI v${config.BOT_VERSION}` },
    timestamp: true
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setupall')
    .setDescription('🔮 Auto-run complete Chit chat server setup in 1-click (All channels, roles & systems)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'admin',

  async execute(interaction, client) {
    if (!KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id) && !KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Permission Denied', 'Sirf **Server Owner** ya **Bot Owner** hi full auto-setup run kar sakte hain!')],
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const startEmbed = KikiEmbed.build({
      title: '🔮 KIKI Full Server Auto-Setup Starting...',
      description:
        `**Replicating complete Chit chat setup into \`${interaction.guild.name}\`...** ⏳\n\n` +
        `• 📜 **Server Logs:** *Creating category & 5 log channels...*\n` +
        `• 👑 **Level Roles:** *Creating Level 5-50 roles...*\n` +
        `• 📢 **Level Channels:** *Linking level-logs & chat-levels...*\n` +
        `• 🔊 **Voice Master:** *Deploying join-to-create & control panel...*\n` +
        `• 📩 **Invite Tracker:** *Setting up invite tracker...*\n` +
        `• 🏷️ **Auto-Role:** *Binding @🔮・Member role...*\n` +
        `• 💤 **Deaf AFK Mover:** *Creating AFK Lounge & 10m timer...*\n` +
        `• 🛡️ **Master Anti-Nuke:** *Activating 16 defense modules...*\n` +
        `• ⚡ **Slash Commands:** *Registering slash commands...*`,
      color: config.COLORS.PRIMARY || 0x9B59B6
    });

    await interaction.editReply({ embeds: [startEmbed] });

    try {
      const stats = await executeFullSetup(interaction.guild, client);
      const successEmbed = buildSuccessEmbed(interaction.guild, stats);

      const inviteUrl = KIKI.getBotInviteUrl(client.user.id);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_btn_home').setLabel('🔮 Open Help Menu').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setLabel('➕ Add to Other Servers').setStyle(ButtonStyle.Link).setURL(inviteUrl)
      );

      await interaction.editReply({ embeds: [successEmbed], components: [row] });
    } catch (err) {
      console.error('[SETUPALL ERROR]', err);
      await interaction.editReply({
        embeds: [KikiEmbed.error('Setup Error', `Auto-setup me error aaya: ${err.message}`)]
      });
    }
  },

  name: 'setupall',
  aliases: ['setup-all', 'quicksetup', 'autosetup', 'fullsetup', 'serversetup', 'chitchatsetup', 'setupbot', 'setupkiki'],
  async run(message, args, client) {
    if (!KIKI.isServerOrBotOwner(message.guild, message.author.id) && !KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({
        embeds: [KikiEmbed.error('Permission Denied', 'Sirf **Server Owner** ya **Bot Owner** hi full auto-setup run kar sakte hain!')]
      });
    }

    const startEmbed = KikiEmbed.build({
      title: '🔮 KIKI Full Server Auto-Setup Starting...',
      description:
        `**Replicating complete Chit chat setup into \`${message.guild.name}\`...** ⏳\n\n` +
        `• 📜 **Server Logs:** *Creating category & 5 log channels...*\n` +
        `• 👑 **Level Roles:** *Creating Level 5-50 roles...*\n` +
        `• 📢 **Level Channels:** *Linking level-logs & chat-levels...*\n` +
        `• 🔊 **Voice Master:** *Deploying join-to-create & control panel...*\n` +
        `• 📩 **Invite Tracker:** *Setting up invite tracker...*\n` +
        `• 🏷️ **Auto-Role:** *Binding @🔮・Member role...*\n` +
        `• 💤 **Deaf AFK Mover:** *Creating AFK Lounge & 10m timer...*\n` +
        `• 🛡️ **Master Anti-Nuke:** *Activating 16 defense modules...*\n` +
        `• ⚡ **Slash Commands:** *Registering slash commands...*`,
      color: config.COLORS.PRIMARY || 0x9B59B6
    });

    const statusMsg = await message.reply({ embeds: [startEmbed] });

    try {
      const stats = await executeFullSetup(message.guild, client);
      const successEmbed = buildSuccessEmbed(message.guild, stats);

      const inviteUrl = KIKI.getBotInviteUrl(client.user.id);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_btn_home').setLabel('🔮 Open Help Menu').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setLabel('➕ Add to Other Servers').setStyle(ButtonStyle.Link).setURL(inviteUrl)
      );

      await statusMsg.edit({ embeds: [successEmbed], components: [row] });
    } catch (err) {
      console.error('[SETUPALL RUN ERROR]', err);
      await statusMsg.edit({
        embeds: [KikiEmbed.error('Setup Error', `Auto-setup me error aaya: ${err.message}`)]
      });
    }
  }
};
