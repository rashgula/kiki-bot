// KIKI Bot - Guild Member Remove Event (Leave Logs & Anti-Kick Protection)
const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');
const KIKI = require('../utils/kiki.js');
const KikiEmbed = require('../utils/embed.js');
const config = require('../config.js');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    if (!member.guild) return;
    const cfg = KIKI.loadConfig();

    // ── 1. Leave Log / Animated Goodbye Card ───────────────────────
    const leaveChannel = KIKI.getGuildChannel(member.guild, 'leave_channel_id');
    const isLeaveEnabled = cfg.guilds?.[member.guild.id]?.leave_enabled !== false && cfg.leave_enabled !== false;

    if (leaveChannel && isLeaveEnabled) {
      try {
        const leavePanel = require('../commands/admin/leavepanel.js');
        const cardPayload = leavePanel.buildLeaveCard(member.guild, member.user, {
          joinedTimestamp: member.joinedTimestamp
        });

        await leaveChannel.send(cardPayload).catch((err) => {
          console.error('[LEAVE MESSAGE SEND ERROR]', err.message);
        });
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
    if (!cfg.antinuke && !cfg.master_antinuke) return;

    try {
      const logs = await member.guild.fetchAuditLogs({ limit: 1 });
      const entry = logs.entries.first();
      if (!entry) return;

      // Ensure log matches this member and is fresh
      if (entry.target?.id && entry.target.id !== member.id) return;
      if (Date.now() - entry.createdTimestamp > 15000) return;

      const executor = entry.executor;
      if (!executor) return;
      if (executor.id === client.user?.id) return;

      // Check if this was an unauthorized Kick or Prune
      if (entry.action === AuditLogEvent.MemberKick || entry.action === AuditLogEvent.MemberPrune) {
        if (KIKI.isSafe(member.guild, executor.id, client)) return;

        console.log(`[ANTINUKE guildMemberRemove] Rogue kick by: ${executor.id}`);

        // Fetch member explicitly for ban
        const rogueM = await member.guild.members.fetch(executor.id).catch(() => null);
        if (rogueM) {
          const botMember = member.guild.members.me;
          if (botMember && botMember.permissions.has(PermissionFlagsBits.BanMembers) &&
              botMember.roles.highest.position > rogueM.roles.highest.position) {
            await member.guild.bans.create(executor.id, { reason: '[KIKI Anti-Nuke] Unauthorized mass kick/prune' });
            console.log(`[ANTINUKE] ✅ Banned ${executor.id} for kicking ${member.user.id}`);
          } else {
            console.error('[ANTINUKE guildMemberRemove] Cannot ban: permission or role hierarchy issue');
          }
        }

        const alert = KikiEmbed.nuke(
          'Anti-Kick Triggered 🚨',
          `**Rogue Admin:** <@${executor.id}> (\`${executor.id}\`)\n` +
          `**Victim:** <@${member.user.id}>\n` +
          `**Action Taken:** Rogue admin PERMANENTLY BANNED!`
        );
        await KIKI.logSecurity(member.guild, alert);
      }
    } catch (err) {
      console.error('[ANTINUKE guildMemberRemove] ERROR:', err);
    }
  }
};
