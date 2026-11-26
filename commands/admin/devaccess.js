// KIKI Bot - Sole Owner Exclusive Trusted Developer Access Manager Command (Discord Only)
// Strictly restricted ONLY to primary Bot Owner (OWNER_IDS). Never accessible from website UI, developers, co-owners, or admins.

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const DevAccess = require('../../utils/devAccess.js');
const GitHubIntegration = require('../../utils/githubIntegration.js');
const RailwayIntegration = require('../../utils/railwayIntegration.js');
const ActivityLogger = require('../../utils/activityLogger.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('devaccess')
    .setDescription('🔐 Sole Owner Exclusive: Manage Trusted Developer Portal Access')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s =>
      s.setName('invite')
        .setDescription('Generate single-use time-limited invite link for ONE verified developer')
        .addUserOption(o => o.setName('friend').setDescription('Authorized developer Discord user').setRequired(true))
        .addIntegerOption(o => o.setName('minutes').setDescription('Expiry in minutes (5-1440)').setMinValue(5).setMaxValue(1440))
    )
    .addSubcommand(s => s.setName('revoke').setDescription('Immediately revoke Trusted Developer access and terminate sessions'))
    .addSubcommand(s => s.setName('status').setDescription('View Developer, GitHub PR & Railway deployment status'))
    .addSubcommand(s =>
      s.setName('approve')
        .setDescription('Approve, merge into main & trigger deploy for a maintenance PR')
        .addIntegerOption(o => o.setName('pr').setDescription('GitHub PR number').setRequired(true))
    )
    .addSubcommand(s =>
      s.setName('reject')
        .setDescription('Close/reject a maintenance PR without merging')
        .addIntegerOption(o => o.setName('pr').setDescription('GitHub PR number').setRequired(true))
    )
    .addSubcommand(s =>
      s.setName('autodeploy')
        .setDescription('Enable or disable Owner-authorized Urgent Auto-Deploy')
        .addBooleanOption(o => o.setName('enabled').setDescription('Allow auto-merge on passing tests').setRequired(true))
    )
    .addSubcommand(s =>
      s.setName('setkey')
        .setDescription('Privately save encrypted GitHub / AI / Railway integration setting')
        .addStringOption(o => o.setName('key').setDescription('Setting name').setRequired(true).addChoices(
          { name: 'GITHUB_TOKEN', value: 'githubToken' },
          { name: 'GEMINI_API_KEY', value: 'aiApiKey' },
          { name: 'DASHBOARD_BASE_URL', value: 'dashboardBaseUrl' },
          { name: 'RAILWAY_API_TOKEN', value: 'railwayToken' },
          { name: 'RAILWAY_PROJECT_ID', value: 'railwayProjectId' },
          { name: 'RAILWAY_SERVICE_ID', value: 'railwayServiceId' },
          { name: 'RAILWAY_ENVIRONMENT_ID', value: 'railwayEnvironmentId' },
          { name: 'DISCORD_CLIENT_SECRET', value: 'discordClientSecret' }
        ))
        .addStringOption(o => o.setName('value').setDescription('Secret or config value').setRequired(true))
    )
    .addSubcommand(s => s.setName('deploy').setDescription('Trigger Railway service redeploy'))
    .addSubcommand(s =>
      s.setName('rollback')
        .setDescription('Roll back Railway to a previous working deployment')
        .addStringOption(o => o.setName('deployment_id').setDescription('Railway SUCCESS deployment ID').setRequired(true))
    )
    .addSubcommand(s => s.setName('protect').setDescription('Apply branch protection rules on GitHub main branch'))
    .addSubcommand(s => s.setName('logs').setDescription('View recent Trusted Developer activity logs')),

  async handleButton(interaction, client) {
    if (!DevAccess.isSoleOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Sole Owner Exclusive 🔒', 'Sirf **Sole Bot Owner** ye action approve ya revoke kar sakta hai!')],
        ephemeral: true
      });
    }

    const cid = interaction.customId;
    if (cid === 'devacc_revoke') {
      const out = DevAccess.revokeDeveloper(interaction.user.id, 'Revoked via Discord DM button');
      return interaction.update({
        embeds: [KikiEmbed.error('🛑 Trusted Developer Access Revoked', `Access revoked for \`${out.previousDeveloper?.discordTag || 'active developer'}\`. All web sessions invalidated!`)],
        components: []
      });
    }

    if (cid.startsWith('devacc_approve_')) {
      const prNum = parseInt(cid.replace('devacc_approve_', ''), 10);
      await interaction.deferUpdate();
      const mergeRes = await GitHubIntegration.approveAndMergePullRequest(interaction.user.id, prNum, false);
      if (!mergeRes.success) {
        return interaction.followUp({ embeds: [KikiEmbed.error('Merge Failed', mergeRes.error)], ephemeral: true });
      }
      const rwRes = await RailwayIntegration.triggerRedeploy({ role: 'owner', discordId: interaction.user.id, discordTag: interaction.user.tag }).catch(() => ({ success: false }));
      return interaction.editReply({
        embeds: [KikiEmbed.success(
          `✅ Approved, Merged & Live Deploying (PR #${prNum})`,
          `• **Merged to:** \`main\` (\`${String(mergeRes.sha || '').slice(0, 7)}\`)\n` +
          `• **Railway:** ${rwRes.success ? 'Redeploy Triggered 🚀' : 'GitHub main updated (Railway auto-deploy follows)'}\n` +
          `• **PC Sync:** \`scripts/pc-sync.js\` agle ~20s me \`main\` aapke PC par pull kar lega!`
        )],
        components: []
      });
    }

    if (cid.startsWith('devacc_reject_')) {
      const prNum = parseInt(cid.replace('devacc_reject_', ''), 10);
      await interaction.deferUpdate();
      const res = await GitHubIntegration.closePullRequest(interaction.user.id, prNum);
      if (!res.success) {
        return interaction.followUp({ embeds: [KikiEmbed.error('Reject Failed', res.error)], ephemeral: true });
      }
      return interaction.editReply({
        embeds: [KikiEmbed.warn(`❌ PR #${prNum} Rejected`, 'Pull request close kar di gayi hai. `main` branch me koi change nahi hua.')],
        components: []
      });
    }
  },

  async execute(interaction, client) {
    if (!DevAccess.isSoleOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Sole Owner Exclusive 🔒', 'Ye command sirf **Sole Bot Owner** use kar sakta hai! Trusted Developer ya Admins ko access nahi hai.')],
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'invite') {
      const friend = interaction.options.getUser('friend');
      const mins = interaction.options.getInteger('minutes') || 30;
      try {
        const inv = DevAccess.createInvite(interaction.user.id, friend.id, friend.tag, mins);
        return interaction.reply({
          embeds: [KikiEmbed.purple(
            '🎟️ Single-Use Developer Invite Created',
            `**Bound Friend:** ${friend.toString()} (\`${friend.tag}\` • \`${friend.id}\`)\n` +
            `**Expires:** <t:${Math.floor(inv.expiresAt / 1000)}:R> *(Single-use)*\n\n` +
            `**Private Invite URL (Sirf friend ko bhejein):**\n\`${inv.inviteUrl}\`\n\n` +
            `• Website par kisi ko ownership section nahi dikhega.\n` +
            `• Revoke anytime via \`/devaccess revoke\`.`
          )],
          ephemeral: true
        });
      } catch (e) {
        return interaction.reply({ embeds: [KikiEmbed.error('Invite Failed', e.message)], ephemeral: true });
      }
    }

    if (sub === 'setkey') {
      const key = interaction.options.getString('key');
      const val = interaction.options.getString('value');
      DevAccess.saveOwnerIntegrations(interaction.user.id, { [key]: val });
      return interaction.reply({
        embeds: [KikiEmbed.success('Encrypted Setting Saved 🔐', `Key \`${key}\` AES-256-GCM encryption ke sath save ho gayi hai!`)],
        ephemeral: true
      });
    }

    if (sub === 'revoke') {
      const out = DevAccess.revokeDeveloper(interaction.user.id, 'Revoked via /devaccess revoke');
      return interaction.reply({
        embeds: [KikiEmbed.success('Developer Revoked 🛑', `Access revoked for \`${out.previousDeveloper?.discordTag || 'active developer'}\`. All active sessions terminated immediately!`)],
        ephemeral: true
      });
    }

    if (sub === 'autodeploy') {
      const enabled = interaction.options.getBoolean('enabled');
      DevAccess.setUrgentAutoDeploy(interaction.user.id, enabled);
      return interaction.reply({
        embeds: [KikiEmbed.info('Urgent Auto-Deploy Updated ⚡', `Urgent Auto-Deploy is now **${enabled ? 'ENABLED' : 'DISABLED'}**.`)],
        ephemeral: true
      });
    }

    if (sub === 'approve') {
      await interaction.deferReply({ ephemeral: true });
      const pr = interaction.options.getInteger('pr');
      const res = await GitHubIntegration.approveAndMergePullRequest(interaction.user.id, pr, false);
      if (!res.success) return interaction.editReply({ embeds: [KikiEmbed.error('Merge Failed', res.error)] });
      await RailwayIntegration.triggerRedeploy({ role: 'owner', discordId: interaction.user.id, discordTag: interaction.user.tag }).catch(() => {});
      return interaction.editReply({ embeds: [KikiEmbed.success('PR Approved & Merged ✅', `PR #${pr} merged into \`main\` and Railway deploy triggered!`)] });
    }

    if (sub === 'reject') {
      await interaction.deferReply({ ephemeral: true });
      const pr = interaction.options.getInteger('pr');
      const res = await GitHubIntegration.closePullRequest(interaction.user.id, pr);
      return interaction.editReply({ embeds: [res.success ? KikiEmbed.warn(`PR #${pr} Closed ❌`, 'Closed without merging.') : KikiEmbed.error('Reject Failed', res.error)] });
    }

    if (sub === 'deploy') {
      await interaction.deferReply({ ephemeral: true });
      const res = await RailwayIntegration.triggerRedeploy({ role: 'owner', discordId: interaction.user.id, discordTag: interaction.user.tag });
      return interaction.editReply({ embeds: [res.success ? KikiEmbed.success('Railway Redeploy 🚀', res.message) : KikiEmbed.error('Deploy Error', res.error)] });
    }

    if (sub === 'rollback') {
      await interaction.deferReply({ ephemeral: true });
      const id = interaction.options.getString('deployment_id');
      const res = await RailwayIntegration.rollbackDeployment(interaction.user.id, id);
      return interaction.editReply({ embeds: [res.success ? KikiEmbed.success('Rollback Started ⏪', `Rolled back to \`${id}\``) : KikiEmbed.error('Rollback Error', res.error)] });
    }

    if (sub === 'protect') {
      await interaction.deferReply({ ephemeral: true });
      const res = await GitHubIntegration.applyMainBranchProtection(interaction.user.id);
      return interaction.editReply({ embeds: [res.success ? KikiEmbed.success('Branch Protected 🛡️', '`main` branch protection rules enabled!') : KikiEmbed.error('Protection Error', res.error)] });
    }

    if (sub === 'logs') {
      const logs = ActivityLogger.getRecent(10);
      const desc = logs.length
        ? logs.map(l => `• **${l.action}** (<t:${Math.floor(l.epochMs / 1000)}:R>) — ${l.actorTag}: ${l.summary}`).join('\n')
        : 'No maintenance activity recorded yet.';
      return interaction.reply({ embeds: [KikiEmbed.purple('📜 Recent Maintenance Logs', desc.slice(0, 3900))], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const [st, gh, rw] = await Promise.all([
      Promise.resolve(DevAccess.getPublicSafeStatus()),
      GitHubIntegration.getStatus(),
      RailwayIntegration.getDeployments(3)
    ]);
    const embed = KikiEmbed.purple('🔐 Trusted Developer System Status',
      `👑 **Sole Owner:** ${st.soleOwnerIds.map(id => `<@${id}>`).join(', ')}\n` +
      `👨‍💻 **Trusted Developer:** ${st.developer ? `\`${st.developer.discordTag}\` (${st.developer.status})` : '`None Active`'}\n` +
      `🎟️ **Pending Invite:** ${st.pendingInvite ? `Target \`${st.pendingInvite.targetDiscordId}\` (<t:${Math.floor(st.pendingInvite.expiresAt / 1000)}:R>)` : '`None`'}\n` +
      `⚡ **Urgent Auto-Deploy:** \`${st.settings.urgentAutoDeploy ? 'ON' : 'OFF'}\`\n` +
      `🐙 **GitHub:** \`${gh.repo}\` (${gh.authMode}) | Open PRs: \`${gh.openPullRequests?.length || 0}\`\n` +
      `🚂 **Railway:** ${rw.configured ? 'Connected ✅' : 'Not Configured'} | Bot Ping: \`${client.ws?.ping ?? 0}ms\`\n` +
      `🌐 **Portal URL:** \`${st.dashboardBaseUrl}/dev\``
    );
    return interaction.editReply({ embeds: [embed] });
  },

  name: 'devaccess',
  aliases: ['devportal', 'devinvite', 'devrevoke'],
  async run(message, args, client) {
    if (!DevAccess.isSoleOwner(message.author.id)) {
      return message.reply({
        embeds: [KikiEmbed.error('Sole Owner Exclusive 🔒', 'Sirf **Sole Bot Owner** hi Trusted Developer access manage kar sakte hain!')]
      });
    }

    const sub = (args[0] || 'status').toLowerCase();

    if (sub === 'invite') {
      const targetUser = message.mentions?.users?.first?.() || (args[1] ? await client.users.fetch(args[1].replace(/[<@!>]/g, '')).catch(() => null) : null);
      if (!targetUser) {
        return message.reply({ embeds: [KikiEmbed.warn('Usage', '`&devaccess invite @friend [minutes]`')] });
      }
      const mins = parseInt(args[2], 10) || 30;
      try {
        const inv = DevAccess.createInvite(message.author.id, targetUser.id, targetUser.tag, mins);
        await message.delete().catch(() => {});
        await message.author.send({
          embeds: [KikiEmbed.purple(
            '🎟️ Private Developer Invitation (Single-Use)',
            `**Friend:** ${targetUser.tag} (\`${targetUser.id}\`)\n` +
            `**Expires:** <t:${Math.floor(inv.expiresAt / 1000)}:R>\n\n` +
            `**Private URL (Send ONLY to this friend):**\n${inv.inviteUrl}`
          )]
        }).catch(() => {});
        return message.channel.send({
          embeds: [KikiEmbed.success('Private Invite Sent to Owner DM 📩', `Single-use invite link aapke **DM** me bhej diya gaya hai taaki server chat me leak na ho!`)]
        });
      } catch (e) {
        return message.reply({ embeds: [KikiEmbed.error('Invite Error', e.message)] });
      }
    }

    if (sub === 'revoke') {
      const out = DevAccess.revokeDeveloper(message.author.id, 'Revoked via &devaccess revoke');
      return message.reply({
        embeds: [KikiEmbed.success('Developer Revoked 🛑', `Access revoked for \`${out.previousDeveloper?.discordTag || 'active developer'}\`. Active sessions killed!`)]
      });
    }

    if (sub === 'autodeploy') {
      const enabled = args[1]?.toLowerCase() === 'on' || args[1]?.toLowerCase() === 'true';
      DevAccess.setUrgentAutoDeploy(message.author.id, enabled);
      return message.reply({ embeds: [KikiEmbed.info('Urgent Auto-Deploy', `Set to **${enabled ? 'ON' : 'OFF'}**`)] });
    }

    if (sub === 'approve' && args[1]) {
      const pr = parseInt(args[1], 10);
      const res = await GitHubIntegration.approveAndMergePullRequest(message.author.id, pr, false);
      if (!res.success) return message.reply({ embeds: [KikiEmbed.error('Merge Error', res.error)] });
      await RailwayIntegration.triggerRedeploy({ role: 'owner', discordId: message.author.id, discordTag: message.author.tag }).catch(() => {});
      return message.reply({ embeds: [KikiEmbed.success('PR Merged & Deployed ✅', `PR #${pr} merged into \`main\`!`)] });
    }

    if (sub === 'reject' && args[1]) {
      const pr = parseInt(args[1], 10);
      const res = await GitHubIntegration.closePullRequest(message.author.id, pr);
      return message.reply({ embeds: [res.success ? KikiEmbed.warn(`PR #${pr} Closed ❌`, 'Rejected without merging.') : KikiEmbed.error('Reject Error', res.error)] });
    }

    if (sub === 'deploy') {
      const res = await RailwayIntegration.triggerRedeploy({ role: 'owner', discordId: message.author.id, discordTag: message.author.tag });
      return message.reply({ embeds: [res.success ? KikiEmbed.success('Railway Deploy 🚀', res.message) : KikiEmbed.error('Deploy Error', res.error)] });
    }

    if (sub === 'rollback' && args[1]) {
      const res = await RailwayIntegration.rollbackDeployment(message.author.id, args[1]);
      return message.reply({ embeds: [res.success ? KikiEmbed.success('Rollback Started ⏪', args[1]) : KikiEmbed.error('Rollback Error', res.error)] });
    }

    if (sub === 'logs') {
      const logs = ActivityLogger.getRecent(10);
      const desc = logs.length
        ? logs.map(l => `• **${l.action}** (<t:${Math.floor(l.epochMs / 1000)}:R>) — ${l.actorTag}: ${l.summary}`).join('\n')
        : 'No logs yet.';
      return message.reply({ embeds: [KikiEmbed.purple('📜 Maintenance Activity Logs', desc.slice(0, 3900))] });
    }

    const st = DevAccess.getPublicSafeStatus();
    return message.reply({
      embeds: [KikiEmbed.purple('🔐 Trusted Developer Status',
        `👑 **Sole Owner:** ${st.soleOwnerIds.map(id => `<@${id}>`).join(', ')}\n` +
        `👨‍💻 **Developer:** ${st.developer ? `\`${st.developer.discordTag}\` (${st.developer.status})` : '`None Active`'}\n` +
        `🌐 **Portal:** \`${st.dashboardBaseUrl}/dev\`\n\n` +
        `**Owner Discord Commands:** \`&devaccess invite @friend\`, \`&devaccess revoke\`, \`&devaccess approve <pr>\`, \`&devaccess reject <pr>\`, \`&devaccess autodeploy on|off\`, \`&devaccess logs\``
      )]
    });
  }
};
