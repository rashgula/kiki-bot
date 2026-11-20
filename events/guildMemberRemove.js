// KIKI Bot - Guild Member Remove Event (Leave Logs & Anti-Kick Protection)
const { AuditLogEvent } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');
const config = require('../config.js');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    if (!member.guild) return;
    const cfg = KIKI.loadConfig();

    // ── 1. Leave Log / Goodbye Card ─────────────────────────────────
    if (cfg.leave_channel_id) {
      try {
        const leaveChannel = member.guild.channels.cache.get(cfg.leave_channel_id) ||
          await member.guild.channels.fetch(cfg.leave_channel_id).catch(() => null);

        if (leaveChannel) {
          const joinedAt = member.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
            : 'Unknown';

          const embed = KikiEmbed.build({
            title: '🚪 Member Left',
            description: `${member.user.toString()} (\`${member.user.tag}\`) server chhod kar chala gaya.`,
            color: config.COLORS.RED || 0xC0392B,
            thumbnail: member.user.displayAvatarURL({ dynamic: true }),
            fields: [
              { name: '👤 Member', value: `${member.user.tag} (\`${member.user.id}\`)`, inline: true },
              { name: '📊 Remaining Members', value: `#${member.guild.memberCount}`, inline: true },
              { name: '📅 Joined Server', value: joinedAt, inline: true }
            ]
          });

          await leaveChannel.send({ embeds: [embed] }).catch(() => {});
        }
      } catch (err) {
        console.error('[LEAVE LOG ERROR]', err.message);
      }
    }

    // ── 2. Invite Tracker Leave Update ─────────────────────────────
    try {
      const InviteTracker = require('../utils/inviteTracker.js');
      await InviteTracker.handleMemberRemove(member, client);
    } catch (err) {
      console.error('[INVITE TRACKER guildMemberRemove ERROR]', err.message);
    }

    // ── 3. Master Anti-Nuke (Rogue Kick/Prune Protection) ─────────────
    if (cfg.antinuke === false || cfg.master_antinuke === false) return;

    try {
      const logs = await member.guild.fetchAuditLogs({ limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      // Ensure log matches this member and is fresh
      if (entry.target?.id && entry.target.id !== member.id) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;

      // Check if this was an unauthorized Kick or Prune
      if (entry.action === AuditLogEvent.MemberKick || entry.action === AuditLogEvent.MemberPrune) {
        if (KIKI.isSafe(member.guild, executor.id, client)) return;

        // Rogue kick detected: Ban the executor
        await member.guild.members.ban(executor.id, { reason: '[KIKI Master Anti-Nuke] Unauthorized mass kick/prune' });
        console.log(`[ANTINUKE] Banned ${executor.tag} for kicking ${member.user.tag}`);

        const alert = KikiEmbed.nuke(
          'Anti-Kick Triggered 🚨',
          `**Rogue Admin:** ${executor.tag} (\`${executor.id}\`)\n` +
          `**Victim:** ${member.user.tag}\n` +
          `**Action Taken:** Rogue admin has been PERMANENTLY BANNED.`
        );
        await KIKI.logSecurity(member.guild, alert);
      }
    } catch (err) {
      console.error('[ANTINUKE guildMemberRemove]', err.message);
    }
  }
};
