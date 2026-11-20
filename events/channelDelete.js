const { AuditLogEvent } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'channelDelete',
  async execute(channel, client) {
    if (!channel.guild) return;

    // Ignore Voice Master temporary voice channels
    try {
      const VoiceMaster = require('../utils/voiceMaster.js');
      if (VoiceMaster.isTempChannel(channel.id)) return;
    } catch {}

    const cfg = KIKI.loadConfig();
    if (cfg.antinuke === false || cfg.master_antinuke === false) return;

    try {
      const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      if (entry.target?.id && entry.target.id !== channel.id) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;

      if (KIKI.isSafe(channel.guild, executor.id, client)) return;

      // Rogue action detected: Ban executor immediately
      await channel.guild.members.ban(executor.id, { reason: '[KIKI Master Anti-Nuke] Rogue channel deletion' });

      // Auto-Restore deleted channel
      const restored = await channel.guild.channels.create({
        name: channel.name,
        type: channel.type,
        parent: channel.parentId,
        topic: channel.topic,
        nsfw: channel.nsfw,
        rateLimitPerUser: channel.rateLimitPerUser,
        permissionOverwrites: channel.permissionOverwrites?.cache?.map(p => ({
          id: p.id,
          allow: p.allow.bitfield,
          deny: p.deny.bitfield
        })) || [],
        reason: '[KIKI Master Anti-Nuke] Auto-restored deleted channel'
      });

      console.log(`[ANTINUKE] Banned ${executor.tag} & restored channel #${channel.name}`);

      const alert = KikiEmbed.nuke(
        'Anti-Channel Delete Triggered 🚨',
        `**Rogue User:** ${executor.tag} (\`${executor.id}\`)\n` +
        `**Deleted Channel:** #${channel.name}\n` +
        `**Action Taken:** Banned rogue executor & auto-recreated channel: ${restored.toString()}`
      );
      await KIKI.logSecurity(channel.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE channelDelete]', err.message);
    }
  }
};
