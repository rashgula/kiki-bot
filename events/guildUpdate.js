const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'guildUpdate',
  async execute(oldGuild, newGuild, client) {
    const cfg = KIKI.loadConfig();
    if (!cfg.antinuke && !cfg.master_antinuke) return;

    try {
      const logs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;
      if (executor.id === client.user?.id) return;

      if (KIKI.isSafe(newGuild, executor.id, client)) return;

      console.log(`[ANTINUKE guildUpdate] Rogue user: ${executor.id}`);

      const member = await newGuild.members.fetch(executor.id).catch(() => null);
      if (!member) return;

      const botMember = newGuild.members.me;
      if (!botMember || !botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
        console.error('[ANTINUKE guildUpdate] Bot lacks BanMembers permission!');
        return;
      }
      if (botMember.roles.highest.position <= member.roles.highest.position) {
        console.error('[ANTINUKE guildUpdate] Cannot ban: target role too high!');
        return;
      }

      // Revert name if changed
      if (oldGuild.name !== newGuild.name) {
        await newGuild.setName(oldGuild.name, '[KIKI Anti-Nuke] Auto-revert rename').catch(() => {});
      }
      // Revert icon if changed
      if (oldGuild.icon !== newGuild.icon && oldGuild.iconURL()) {
        await newGuild.setIcon(oldGuild.iconURL(), '[KIKI Anti-Nuke] Auto-revert icon').catch(() => {});
      }

      await newGuild.bans.create(executor.id, { reason: '[KIKI Anti-Nuke] Unauthorized server settings tampering' });
      console.log(`[ANTINUKE] ✅ Banned ${executor.id} for server settings tamper`);

      const alert = KikiEmbed.nuke(
        'Anti-Server Tamper Triggered 🚨',
        `**Rogue User:** <@${executor.id}> (\`${executor.id}\`)\n` +
        `**Action Taken:** Server settings reverted & user PERMANENTLY BANNED!`
      );
      await KIKI.logSecurity(newGuild, alert);
    } catch (err) {
      console.error('[ANTINUKE guildUpdate] ERROR:', err);
    }
  }
};
