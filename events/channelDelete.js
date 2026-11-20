const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
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
    if (!cfg.antinuke && !cfg.master_antinuke) return;

    try {
      const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;
      if (entry.target?.id && entry.target.id !== channel.id) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;
      if (executor.id === client.user?.id) return;

      // Whitelist check: safe users allowed
      if (KIKI.isSafe(channel.guild, executor.id, client)) return;

      console.log(`[ANTINUKE channelDelete] Rogue user detected: ${executor.id}`);

      // Fetch member explicitly
      const member = await channel.guild.members.fetch(executor.id).catch(() => null);
      if (!member) {
        console.error('[ANTINUKE channelDelete] Could not fetch member:', executor.id);
        return;
      }

      // Check bot role hierarchy
      const botMember = channel.guild.members.me;
      if (!botMember || !botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
        console.error('[ANTINUKE channelDelete] Bot lacks BanMembers permission!');
        return;
      }
      if (botMember.roles.highest.position <= member.roles.highest.position) {
        console.error('[ANTINUKE channelDelete] Cannot ban: target role too high!');
        return;
      }

      // Ban the rogue user
      await channel.guild.bans.create(executor.id, { reason: '[KIKI Anti-Nuke] Unauthorized channel deletion — not whitelisted' });

      // Auto-restore deleted channel
      const restored = await channel.guild.channels.create({
        name: channel.name,
        type: channel.type,
        parent: channel.parentId,
        topic: channel.topic || null,
        nsfw: channel.nsfw || false,
        rateLimitPerUser: channel.rateLimitPerUser || 0,
        permissionOverwrites: channel.permissionOverwrites?.cache?.map(p => ({
          id: p.id,
          allow: p.allow.bitfield,
          deny: p.deny.bitfield
        })) || [],
        reason: '[KIKI Anti-Nuke] Auto-restored deleted channel'
      }).catch(() => null);

      console.log(`[ANTINUKE] ✅ Banned ${executor.id} & restored channel #${channel.name}`);

      const alert = KikiEmbed.nuke(
        'Anti-Channel Delete Triggered 🚨',
        `**Rogue User:** <@${executor.id}> (\`${executor.id}\`)\n` +
        `**Deleted Channel:** \`#${channel.name}\`\n` +
        `**Action Taken:** User PERMANENTLY BANNED & channel auto-restored!${restored ? ` ${restored}` : ''}`
      );
      await KIKI.logSecurity(channel.guild, alert);
    } catch (err) {
      console.error('[ANTINUKE channelDelete] ERROR:', err);
    }
  }
};
