const { AuditLogEvent } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'guildUpdate',
  async execute(oldGuild, newGuild, client) {
    const cfg = KIKI.loadConfig();
    if (cfg.antinuke === false) return;

    try {
      const logs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor) return;

      if (KIKI.isSafe(newGuild, executor.id, client)) return;

      // Revert name if changed
      if (oldGuild.name !== newGuild.name) {
        await newGuild.setName(oldGuild.name, '[KIKI Master Anti-Nuke] Auto-revert unauthorized rename');
      }

      // Revert icon if changed
      if (oldGuild.icon !== newGuild.icon && oldGuild.iconURL()) {
        await newGuild.setIcon(oldGuild.iconURL(), '[KIKI Master Anti-Nuke] Auto-revert unauthorized icon change');
      }

      await newGuild.members.ban(executor.id, { reason: '[KIKI Master Anti-Nuke] Unauthorized server settings tampering' });
      console.log(`[ANTINUKE] Banned ${executor.tag} for tampering with server settings`);

      const alert = KikiEmbed.nuke(
        'Anti-Server Tamper Triggered 🚨',
        `**Rogue User:** ${executor.tag} (\`${executor.id}\`)\n` +
        `**Action Taken:** Server settings reverted and executor banned.`
      );
      await KIKI.logSecurity(newGuild, alert);
    } catch (err) {
      console.error('[ANTINUKE guildUpdate]', err.message);
    }
  }
};
