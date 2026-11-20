const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    if (!ban.guild) return;
    const cfg = KIKI.loadConfig();
    if (!cfg.antinuke && !cfg.master_antinuke) return;

    try {
      const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;
      if (entry.target?.id && entry.target.id !== ban.user.id) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;

      // CRITICAL: Prevent self-ban loop — ignore bans done by the bot itself
      if (executor.id === client.user?.id) return;

      if (KIKI.isSafe(ban.guild, executor.id, client)) return;

      console.log(`[ANTINUKE guildBanAdd] Rogue ban by: ${executor.id}`);

      const member = await ban.guild.members.fetch(executor.id).catch(() => null);
      if (!member) {
        // User might not be in guild anymore, try direct ban anyway
        await ban.guild.bans.create(executor.id, { reason: '[KIKI Anti-Nuke] Rogue mass ban attempt' }).catch(e => console.error('[ANTINUKE] Direct ban failed:', e.message));
        await ban.guild.bans.remove(ban.user.id, '[KIKI Anti-Nuke] Auto-unban victim').catch(() => {});
        return;
      }

      const botMember = ban.guild.members.me;
      if (!botMember || !botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
        console.error('[ANTINUKE guildBanAdd] Bot lacks BanMembers permission!');
        return;
      }
      if (botMember.roles.highest.position <= member.roles.highest.position) {
        console.error('[ANTINUKE guildBanAdd] Cannot ban: target role too high!');
        return;
      }

      await ban.guild.bans.create(executor.id, { reason: '[KIKI Anti-Nuke] Rogue mass ban attempt' });
      await ban.guild.bans.remove(ban.user.id, '[KIKI Anti-Nuke] Auto-unban victim').catch(() => {});

      console.log(`[ANTINUKE] ✅ Banned rogue admin ${executor.id} & unbanned victim ${ban.user.id}`);

      const alert = KikiEmbed.nuke(
        'Anti-Mass Ban Triggered 🚨',
        `**Rogue Admin:** <@${executor.id}> (\`${executor.id}\`)\n` +
        `**Banned Victim:** <@${ban.user.id}> (\`${ban.user.id}\`)\n` +
        `**Action Taken:** Rogue admin PERMANENTLY BANNED & victim auto-unbanned!`
      );
      await KIKI.logSecurity(ban.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE guildBanAdd] ERROR:', err);
    }
  }
};
