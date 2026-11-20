const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'roleCreate',
  async execute(role, client) {
    if (!role.guild) return;
    const cfg = KIKI.loadConfig();
    if (!cfg.antinuke && !cfg.master_antinuke) return;

    try {
      const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;
      if (entry.target?.id && entry.target.id !== role.id) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;
      if (executor.id === client.user?.id) return;

      if (KIKI.isSafe(role.guild, executor.id, client)) return;

      console.log(`[ANTINUKE roleCreate] Rogue user detected: ${executor.id}`);

      const member = await role.guild.members.fetch(executor.id).catch(() => null);
      if (!member) {
        console.error('[ANTINUKE roleCreate] Could not fetch member:', executor.id);
        return;
      }

      const botMember = role.guild.members.me;
      if (!botMember || !botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
        console.error('[ANTINUKE roleCreate] Bot lacks BanMembers permission!');
        return;
      }
      if (botMember.roles.highest.position <= member.roles.highest.position) {
        console.error('[ANTINUKE roleCreate] Cannot ban: target role too high!');
        return;
      }

      // Delete rogue role & ban
      await role.delete('[KIKI Anti-Nuke] Rogue role creation').catch(() => {});
      await role.guild.bans.create(executor.id, { reason: '[KIKI Anti-Nuke] Unauthorized role creation — not whitelisted' });

      console.log(`[ANTINUKE] ✅ Banned ${executor.id} for unauthorized role creation`);

      const alert = KikiEmbed.nuke(
        'Anti-Role Create Triggered 🚨',
        `**Rogue User:** <@${executor.id}> (\`${executor.id}\`)\n` +
        `**Rogue Role:** \`@${role.name}\`\n` +
        `**Action Taken:** Rogue role deleted & user PERMANENTLY BANNED!`
      );
      await KIKI.logSecurity(role.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE roleCreate] ERROR:', err);
    }
  }
};
