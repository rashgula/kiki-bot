const { AuditLogEvent } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'roleDelete',
  async execute(role, client) {
    if (!role.guild) return;
    const cfg = KIKI.loadConfig();
    if (cfg.antinuke === false || cfg.master_antinuke === false) return;

    try {
      const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      if (entry.target?.id && entry.target.id !== role.id) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;

      if (KIKI.isSafe(role.guild, executor.id, client)) return;

      // Ban executor
      await role.guild.members.ban(executor.id, { reason: '[KIKI Master Anti-Nuke] Rogue role deletion' });

      // Auto-Restore deleted role
      const restored = await role.guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        permissions: role.permissions,
        mentionable: role.mentionable,
        reason: '[KIKI Master Anti-Nuke] Auto-restored deleted role'
      });

      console.log(`[ANTINUKE] Banned ${executor.tag} & restored role @${role.name}`);

      const alert = KikiEmbed.nuke(
        'Anti-Role Delete Triggered 🚨',
        `**Rogue User:** ${executor.tag} (\`${executor.id}\`)\n` +
        `**Deleted Role:** @${role.name}\n` +
        `**Action Taken:** Banned rogue executor & auto-recreated role: ${restored.toString()}`
      );
      await KIKI.logSecurity(role.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE roleDelete]', err.message);
    }
  }
};
