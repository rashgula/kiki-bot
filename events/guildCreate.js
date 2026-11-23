// KIKI Bot - Guild Join Event (Greeting & Slash Sync Only — NO Auto-Creation without &setupall!)
const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const chalk = require('chalk');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');
const config = require('../config.js');

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    console.log(chalk.magenta.bold(`\n  🎉 [NEW SERVER JOINED] KIKI was added to: ${guild.name} (${guild.id}) • Members: ${guild.memberCount}`));

    try {
      // 1. Fetch channels & roles to hydrate cache
      await guild.channels.fetch().catch(() => {});
      await guild.roles.fetch().catch(() => {});

      // 2. Initialize Guild entry in config (clean state, NOT configured yet)
      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[guild.id]) {
        cfg.guilds[guild.id] = {
          configured: false
        };
        KIKI.saveConfig(cfg);
      }

      // 3. Register Slash Commands specifically for this new server immediately
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

      // 4. Update Invite Tracker Cache for this guild if permitted
      try {
        const InviteTracker = require('../utils/inviteTracker.js');
        if (guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild)) {
          const invites = await guild.invites.fetch().catch(() => null);
          if (invites) {
            InviteTracker.cacheGuildInvites(guild.id, invites);
          }
        }
      } catch (e) {}

      // 5. Send Greeting Embed in the server's System Channel or First Available Text Channel
      const targetChannel = guild.systemChannel ||
        guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages));

      if (targetChannel) {
        const inviteUrl = KIKI.getBotInviteUrl(client.user.id);
        const embed = KikiEmbed.build({
          title: `🔮 KIKI Joined ${guild.name}!`,
          description:
            `**Namaste! KIKI gothic discord bot is server me successfully connect ho chuka hai.** 💜\n\n` +
            `⚙️ **Server Setup:**\n` +
            `Agar aap is server me sabhi log channels, level roles, Voice Master aur systems setup karna chahte hain, toh sirf **\`&setupall\`** run karein!\n` +
            `*(Bina command run kiye bot koi bhi channel ya role create nahi karega).* ✨\n\n` +
            `• 🚀 **1-Click Full Setup:** \`&setupall\` ya \`/setupall\`\n` +
            `• 📜 **Command Library:** \`&help\` (1,114+ Commands)\n` +
            `• 📌 **Prefix:** \`${config.PREFIX}\`\n\n` +
            `*💡 Tip: Aap meri profile/bio par click karke direct blue **"Add App"** button dabakar bhi mujhe kisi aur server me add kar sakte hain.*`,
          color: config.COLORS.PRIMARY || 0x9B59B6,
          footer: { text: `KIKI v${config.BOT_VERSION} • Multi-Server Isolation` },
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
