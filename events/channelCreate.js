const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'channelCreate',
  async execute(channel, client) {
    if (!channel.guild) return;
    const cfg = KIKI.loadConfig();
    if (!cfg.antinuke && !cfg.master_antinuke) return;

    try {
      const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;
      if (entry.target?.id && entry.target.id !== channel.id) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;
      if (executor.id === client.user?.id) return;

      // Whitelist check: safe users allowed
      if (KIKI.isSafe(channel.guild, executor.id, client)) return;

      console.log(`[ANTINUKE channelCreate] Rogue user detected: ${executor.id}`);

      // Fetch member explicitly to ensure ban works
      const member = await channel.guild.members.fetch(executor.id).catch(() => null);
      if (!member) {
        console.error('[ANTINUKE channelCreate] Could not fetch member:', executor.id);
        return;
      }

      // Check bot role hierarchy
      const botMember = channel.guild.members.me;
      if (!botMember || !botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
        console.error('[ANTINUKE channelCreate] Bot lacks BanMembers permission!');
        return;
      }
      if (botMember.roles.highest.position <= member.roles.highest.position) {
        console.error('[ANTINUKE channelCreate] Cannot ban: target role too high!');
        return;
      }

      // Delete rogue channel first
      await channel.delete('[KIKI Anti-Nuke] Rogue channel creation').catch(() => {});

      // Ban the rogue user
      await channel.guild.bans.create(executor.id, { reason: '[KIKI Anti-Nuke] Unauthorized channel creation — not whitelisted' });

      console.log(`[ANTINUKE] ✅ Banned ${executor.id} for unauthorized channel creation`);

      const alert = KikiEmbed.nuke(
        'Anti-Channel Create Triggered 🚨',
        `**Rogue User:** <@${executor.id}> (\`${executor.id}\`)\n` +
        `**Rogue Channel:** \`#${channel.name}\`\n` +
        `**Action Taken:** Rogue channel deleted & user PERMANENTLY BANNED!`
      );
      await KIKI.logSecurity(channel.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE channelCreate] ERROR:', err);
    }
  }
};
