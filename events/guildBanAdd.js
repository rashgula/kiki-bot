const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    if (!ban.guild) return;
    const cfg = KIKI.loadConfig();
    if (cfg.antinuke === false || cfg.master_antinuke === false) return;

    try {
      const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      // Ensure audit log matches this ban event
      if (entry.target?.id && entry.target.id !== ban.user.id) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;

      // Prevent self-ban infinite loop — ignore bans done by the bot itself
      if (executor.id === client.user?.id) return;

      if (KIKI.isSafe(ban.guild, executor.id, client)) return;

      // Check bot has BanMembers permission and role hierarchy
      const botMember = ban.guild.members.me || await ban.guild.members.fetch(client.user.id).catch(() => null);
      if (!botMember || !botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
        console.error('[ANTINUKE guildBanAdd] Bot lacks BanMembers permission!');
        return;
      }
      const target = ban.guild.members.cache.get(executor.id);
      if (target && botMember.roles.highest.position <= target.roles.highest.position) {
        console.error('[ANTINUKE guildBanAdd] Cannot ban: target role too high');
        return;
      }

      // Ban rogue admin and unban victim
      await ban.guild.members.ban(executor.id, { reason: '[KIKI Master Anti-Nuke] Rogue mass ban attempt' });
      await ban.guild.bans.remove(ban.user.id, '[KIKI Master Anti-Nuke] Auto-unban from rogue admin action').catch(() => {});

      console.log(`[ANTINUKE] Banned rogue admin ${executor.tag} & unbanned victim ${ban.user.tag}`);

      const alert = KikiEmbed.nuke(
        'Anti-Mass Ban Triggered 🚨',
        `**Rogue Admin:** ${executor.tag} (\`${executor.id}\`)\n` +
        `**Banned Victim:** ${ban.user.tag} (\`${ban.user.id}\`)\n` +
        `**Action Taken:** Rogue admin permanently banned and victim automatically unbanned!`
      );
      await KIKI.logSecurity(ban.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE guildBanAdd]', err.message);
    }
  }
};
