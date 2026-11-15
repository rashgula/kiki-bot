const { AuditLogEvent } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'roleCreate',
  async execute(role, client) {
    if (!role.guild) return;
    const cfg = KIKI.loadConfig();
    if (cfg.antinuke === false) return;

    try {
      const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      if (entry.target?.id && entry.target.id !== role.id) return;
      if (Date.now() - entry.createdTimestamp > 10000) return;

      const executor = entry.executor;
      if (!executor) return;

      if (KIKI.isSafe(role.guild, executor.id, client)) return;

      // Delete rogue role & ban executor
      await role.delete('[KIKI Master Anti-Nuke] Rogue unauthorized role creation');
      await role.guild.members.ban(executor.id, { reason: '[KIKI Master Anti-Nuke] Unauthorized role flood/create' });

      console.log(`[ANTINUKE] Banned ${executor.tag} & deleted rogue role @${role.name}`);

      const alert = KikiEmbed.nuke(
        'Anti-Role Create Triggered 🚨',
        `**Rogue User:** ${executor.tag} (\`${executor.id}\`)\n` +
        `**Action Taken:** Banned user & deleted rogue role \`@${role.name}\``
      );
      await KIKI.logSecurity(role.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE roleCreate]', err.message);
    }
  }
};
