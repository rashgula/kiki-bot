// KIKI Bot - Guild Join Event (Auto-Setup & Guild Isolation on Invite)
const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const chalk = require('chalk');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');
const bootRestorer = require('../utils/bootRestorer.js');
const config = require('../config.js');

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    console.log(chalk.magenta.bold(`\n  🎉 [NEW SERVER JOINED] KIKI was added to: ${guild.name} (${guild.id}) • Members: ${guild.memberCount}`));

    try {
      // 1. Fetch channels & roles to hydrate cache
      await guild.channels.fetch().catch(() => {});
      await guild.roles.fetch().catch(() => {});

      // 2. Ensure Guild entry in config.json
      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
      KIKI.saveConfig(cfg);

      // 3. Auto-Create / Bind all 5 Log Channels in new server
      const logsCount = await bootRestorer.ensureLogChannels(guild);

      // 4. Auto-Create / Bind Level 5 to 50 Roles in new server
      const rolesCount = await bootRestorer.ensureLevelRoles(guild);

      // 5. Ensure Announce Channels
      bootRestorer.ensureLevelAnnounceChannels(guild);

      // 6. Register Slash Commands specifically for this new server immediately
      try {
        const slashCmds = [];
        for (const [, cmd] of client.commands) {
          if (slashCmds.length >= 100) break;
          if (cmd.data) slashCmds.push(cmd.data.toJSON());
        }
        if (slashCmds.length > 0) {
          await guild.commands.set(slashCmds).catch(() => {});
          console.log(chalk.green(`  ⚡ [SLASH COMMANDS] Registered ${slashCmds.length} commands to ${guild.name}`));
        }
      } catch (err) {
        console.error(`[GUILD CREATE SLASH ERROR] ${guild.name}:`, err.message);
      }

      // 7. Update Invite Tracker Cache for this guild
      try {
        const InviteTracker = require('../utils/inviteTracker.js');
        if (guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild)) {
          const invites = await guild.invites.fetch().catch(() => null);
          if (invites) {
            InviteTracker.cacheGuildInvites(guild.id, invites);
          }
        }
      } catch (e) {}

      // 8. Send Welcome & Status Embed in the new server's Security Log channel or System Channel
      const targetChannel = KIKI.getGuildChannel(guild, 'security_log_channel_id') ||
        guild.systemChannel ||
        guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages));

      if (targetChannel) {
        const inviteUrl = KIKI.getBotInviteUrl(client.user.id);
        const embed = KikiEmbed.build({
          title: `🔮 KIKI Joined ${guild.name} • Setup 100% Ready!`,
          description:
            `**Namaste! KIKI gothic discord bot aapke server me successfully activate ho chuka hai.** ✨\n\n` +
            `Aapko kisi bhi setup command ko run karne ki zaroorat nahi hai. KIKI ne aapke server ke liye automatically alag channels aur roles create aur bind kar diye hain taaki koi bhi setting dusre server se overwrite na ho!\n\n` +
            `🛡️ **Master Anti-Nuke:** 🟢 \`ACTIVE (16+ Defense Modules Live)\`\n` +
            `👑 **Level Roles (5-50):** 🟢 \`${rolesCount}/10 Roles Auto-Configured\`\n` +
            `📜 **Server Logs:** 🟢 \`${logsCount}/5 Channels Created & Linked\`\n` +
            `🎙️ **Voice XP:** 🟢 \`Active (18-23 XP/min in VC)\`\n` +
            `💬 **Chat XP:** 🟢 \`Active (15-25 XP/msg)\`\n` +
            `📌 **Default Prefix:** \`${config.PREFIX}\` | **Slash Commands:** \`/<command>\`\n\n` +
            `*💡 Tip: Aap meri profile/bio par click karke direct blue **"Add App"** button dabakar bhi mujhe kisi aur server me add kar sakte hain.*\n` +
            `*Type \`${config.PREFIX}help\` to browse all 1,114+ commands.*`,
          color: config.COLORS.PRIMARY || 0x9B59B6,
          footer: { text: `Multi-Server Isolation Engine • KIKI v${config.BOT_VERSION}` },
          timestamp: true
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('help_btn_home').setLabel('🔮 Open Help Menu').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setLabel('➕ Add to Other Servers').setStyle(ButtonStyle.Link).setURL(inviteUrl)
        );

        await targetChannel.send({ embeds: [embed], components: [row] }).catch(() => {});
      }

    } catch (err) {
      console.error(`[GUILD CREATE ERROR] ${guild.name}:`, err);
    }
  }
};
