// KIKI Bot - Guild Member Add Event (Welcome + Anti-Bot + Auto-Role)
const { AuditLogEvent } = require('discord.js');
const KikiEmbed = require('../utils/embed.js');
const KIKI = require('../utils/kiki.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const cfg = KIKI.loadConfig();
    const guild = member.guild;
    const isMasterOn = cfg.master_antinuke !== false && cfg.antinuke !== false;

    // 1. Anti-Bot Protection
    if (member.user.bot && isMasterOn) {
      try {
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 1 });
        const entry = logs.entries.first();
        if (entry) {
          const adder = entry.executor;
          if (adder && !KIKI.isSafe(guild, adder.id, client)) {
            await member.kick('[KIKI Master Anti-Nuke] Unauthorized rogue bot added');
            await guild.members.ban(adder.id, { reason: '[KIKI Master Anti-Nuke] Added unauthorized rogue bot' });
            console.log(`[ANTINUKE] Kicked bot ${member.user.tag} and banned adder ${adder.tag}`);

            const alert = KikiEmbed.nuke(
              'Anti-Bot Protection Triggered 🚨',
              `**Rogue Inviter:** ${adder.tag} (\`${adder.id}\`)\n` +
              `**Unauthorized Bot:** ${member.user.tag} (\`${member.user.id}\`)\n` +
              `**Action Taken:** Unauthorized bot was kicked and inviter was permanently banned!`
            );
            await KIKI.logSecurity(guild, alert);
            return;
          }
        }
      } catch (e) {
        console.error('[ANTINUKE bot-add]', e.message);
      }
      return;
    }

    // 1.5 Anti-Raid Mode Lockdown (Per-Guild)
    const isAntiRaid = KIKI.getGuildConfig(guild.id, 'anti_raid', false) === true;
    if (isAntiRaid && !KIKI.isSafe(guild, member.id, client)) {
      try {
        await member.kick('[KIKI Anti-Raid Mode] Server lockdown active — unauthorized join blocked');
        const alert = KikiEmbed.nuke(
          'Anti-Raid Kick 🛡️',
          `**Member:** ${member.user.tag} (\`${member.id}\`)\n**Action:** Auto-kicked because **Anti-Raid Mode** is enabled.`
        );
        await KIKI.logSecurity(guild, alert);
      } catch (e) {
        console.error('[ANTI-RAID KICK]', e.message);
      }
      return;
    }

    // 2. Auto-Role for human members (Multi-Server Isolated)
    const autoroleId = cfg.guilds?.[guild.id]?.autorole_id || (guild.roles.cache.has(cfg.autorole_id) ? cfg.autorole_id : null);
    if (autoroleId && !member.user.bot) {
      try {
        const role = guild.roles.cache.get(autoroleId);
        if (role) {
          await member.roles.add(role, '[KIKI Auto-Role] New member join role');
          console.log(`[AUTOROLE] Assigned @${role.name} to new member ${member.user.tag} in ${guild.name}`);
        }
      } catch (e) {
        console.error('[AUTOROLE]', e.message);
      }
    }

    // 3. Invite Tracker (Who invited & All-Time Stats)
    try {
      const InviteTracker = require('../utils/inviteTracker.js');
      await InviteTracker.handleMemberAdd(member, client);
    } catch (e) {
      console.error('[INVITE TRACKER guildMemberAdd]', e.message);
    }

    // 4. Welcome Message Card
    const welcomeChannel = KIKI.getGuildChannel(guild, 'welcome_channel_id');
    if (welcomeChannel) {
      try {
        const channel = welcomeChannel;
        if (channel) {
          const embed = KikiEmbed.build({
            title: `👋 Welcome to ${guild.name}!`,
            description: `Hey ${member.user.toString()}, welcome to the server!\nMake sure to read the rules and enjoy your stay! 💜\n\n> *${KIKI.randomQuote()}*`,
            color: 0x9B59B6,
            thumbnail: member.user.displayAvatarURL({ dynamic: true }),
            fields: [
              { name: '👤 Member', value: member.user.tag, inline: true },
              { name: '📊 Member Count', value: `#${guild.memberCount}`, inline: true },
              { name: '📅 Joined Discord', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            ],
          });
          await channel.send({ embeds: [embed] });
        }
      } catch (e) {
        console.error('[WELCOME]', e.message);
      }
    }
  },
};
