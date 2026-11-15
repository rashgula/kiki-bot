const { AuditLogEvent } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'webhookUpdate',
  async execute(channel, client) {
    if (!channel.guild) return;
    const cfg = KIKI.loadConfig();
    if (cfg.antinuke === false) return;

    try {
      const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.WebhookCreate, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor) return;

      if (KIKI.isSafe(channel.guild, executor.id, client)) return;

      // Delete created rogue webhooks
      const webhooks = await channel.fetchWebhooks();
      for (const [, wh] of webhooks) {
        if (wh.owner?.id === executor.id) {
          await wh.delete('[KIKI Master Anti-Nuke] Unauthorized rogue webhook');
        }
      }

      await channel.guild.members.ban(executor.id, { reason: '[KIKI Master Anti-Nuke] Rogue webhook creation' });
      console.log(`[ANTINUKE] Banned ${executor.tag} & deleted rogue webhooks in #${channel.name}`);

      const alert = KikiEmbed.nuke(
        'Anti-Webhook Triggered 🚨',
        `**Rogue User:** ${executor.tag} (\`${executor.id}\`)\n` +
        `**Channel:** #${channel.name}\n` +
        `**Action Taken:** Webhooks deleted & executor banned.`
      );
      await KIKI.logSecurity(channel.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE webhookUpdate]', err.message);
    }
  }
};
