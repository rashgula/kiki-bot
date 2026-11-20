const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'roleDelete',
  async execute(role, client) {
    if (!role.guild) return;
    const cfg = KIKI.loadConfig();
    if (!cfg.antinuke && !cfg.master_antinuke) return;

    try {
      const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;
      if (entry.target?.id && entry.target.id !== role.id) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;
      if (executor.id === client.user?.id) return;

      if (KIKI.isSafe(role.guild, executor.id, client)) return;

      console.log(`[ANTINUKE roleDelete] Rogue user detected: ${executor.id}`);

      const member = await role.guild.members.fetch(executor.id).catch(() => null);
      if (!member) {
        console.error('[ANTINUKE roleDelete] Could not fetch member:', executor.id);
        return;
      }

      const botMember = role.guild.members.me;
      if (!botMember || !botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
        console.error('[ANTINUKE roleDelete] Bot lacks BanMembers permission!');
        return;
      }
      if (botMember.roles.highest.position <= member.roles.highest.position) {
        console.error('[ANTINUKE roleDelete] Cannot ban: target role too high!');
        return;
      }

      // Ban rogue user
      await role.guild.bans.create(executor.id, { reason: '[KIKI Anti-Nuke] Unauthorized role deletion — not whitelisted' });

      // Auto-restore deleted role
      const restored = await role.guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        permissions: role.permissions,
        mentionable: role.mentionable,
        reason: '[KIKI Anti-Nuke] Auto-restored deleted role'
      }).catch(() => null);

      console.log(`[ANTINUKE] ✅ Banned ${executor.id} & restored role @${role.name}`);

      const alert = KikiEmbed.nuke(
        'Anti-Role Delete Triggered 🚨',
        `**Rogue User:** <@${executor.id}> (\`${executor.id}\`)\n` +
        `**Deleted Role:** \`@${role.name}\`\n` +
        `**Action Taken:** User PERMANENTLY BANNED & role auto-restored!${restored ? ` ${restored}` : ''}`
      );
      await KIKI.logSecurity(role.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE roleDelete] ERROR:', err);
    }
  }
};
