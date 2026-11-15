const { AuditLogEvent } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    if (!ban.guild) return;
    const cfg = KIKI.loadConfig();
    if (cfg.antinuke === false) return;

    try {
      const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor) return;

      if (KIKI.isSafe(ban.guild, executor.id, client)) return;

      // Ban rogue admin and unban victim
      await ban.guild.members.ban(executor.id, { reason: '[KIKI Master Anti-Nuke] Rogue mass ban attempt' });
      await ban.guild.bans.remove(ban.user.id, '[KIKI Master Anti-Nuke] Auto-unban from rogue admin action');

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
