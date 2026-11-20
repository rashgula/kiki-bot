const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'webhookUpdate',
  async execute(channel, client) {
    if (!channel.guild) return;
    const cfg = KIKI.loadConfig();
    if (!cfg.antinuke && !cfg.master_antinuke) return;

    try {
      const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.WebhookCreate, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;
      if (executor.id === client.user?.id) return;

      if (KIKI.isSafe(channel.guild, executor.id, client)) return;

      console.log(`[ANTINUKE webhookUpdate] Rogue user: ${executor.id}`);

      const member = await channel.guild.members.fetch(executor.id).catch(() => null);
      if (!member) return;

      const botMember = channel.guild.members.me;
      if (!botMember || !botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
        console.error('[ANTINUKE webhookUpdate] Bot lacks BanMembers permission!');
        return;
      }
      if (botMember.roles.highest.position <= member.roles.highest.position) {
        console.error('[ANTINUKE webhookUpdate] Cannot ban: target role too high!');
        return;
      }

      // Delete rogue webhooks
      const webhooks = await channel.fetchWebhooks().catch(() => null);
      if (webhooks) {
        for (const [, wh] of webhooks) {
          if (wh.owner?.id === executor.id) {
            await wh.delete('[KIKI Anti-Nuke] Unauthorized rogue webhook').catch(() => {});
          }
        }
      }

      await channel.guild.bans.create(executor.id, { reason: '[KIKI Anti-Nuke] Rogue webhook creation' });
      console.log(`[ANTINUKE] ✅ Banned ${executor.id} & deleted rogue webhooks`);

      const alert = KikiEmbed.nuke(
        'Anti-Webhook Triggered 🚨',
        `**Rogue User:** <@${executor.id}> (\`${executor.id}\`)\n` +
        `**Channel:** #${channel.name}\n` +
        `**Action Taken:** Rogue webhooks deleted & user PERMANENTLY BANNED!`
      );
      await KIKI.logSecurity(channel.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE webhookUpdate] ERROR:', err);
    }
  }
};
