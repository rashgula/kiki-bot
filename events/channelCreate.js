const { AuditLogEvent } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'channelCreate',
  async execute(channel, client) {
    if (!channel.guild) return;
    const cfg = KIKI.loadConfig();
    if (cfg.antinuke === false || cfg.master_antinuke === false) return;

    try {
      const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      if (entry.target?.id && entry.target.id !== channel.id) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;

      if (KIKI.isSafe(channel.guild, executor.id, client)) return;

      // Rogue action detected: Delete rogue channel & ban executor
      await channel.delete('[KIKI Master Anti-Nuke] Rogue unauthorized channel creation');
      await channel.guild.members.ban(executor.id, { reason: '[KIKI Master Anti-Nuke] Unauthorized channel flood/create' });

      console.log(`[ANTINUKE] Banned ${executor.tag} & deleted rogue channel #${channel.name}`);

      const alert = KikiEmbed.nuke(
        'Anti-Channel Create Triggered 🚨',
        `**Rogue User:** ${executor.tag} (\`${executor.id}\`)\n` +
        `**Action Taken:** Banned user & deleted rogue channel \`#${channel.name}\``
      );
      await KIKI.logSecurity(channel.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE channelCreate]', err.message);
    }
  }
};
