const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const KikiEmojis = require('../../utils/emojis.js');

function buildStatusEmbed(cfg, guild) {
  const isMasterOn = cfg.master_antinuke !== false && cfg.antinuke !== false;
  const wlCount = (cfg.whitelist || []).length;
  const statusBadge = isMasterOn ? `${KikiEmojis.FIRE} **ALL SHIELDS ACTIVE**` : `${KikiEmojis.CROSS} **DEACTIVATED**`;

  const embed = KikiEmbed.purple(
    `${KikiEmojis.SPARKLE} KIKI Master Anti-Nuke Fortress v2.2 ${KikiEmojis.FIRE}`,
    `${KikiEmojis.header()}\n\n` +
    `**Overall Protection Status:** ${statusBadge}\n` +
    `**Server Protected:** **${guild.name}**\n` +
    `**Whitelisted Safe Users:** **${wlCount}** members\n` +
    `**Default Rogue Penalty:** 🔨 **INSTANT BAN & REVERT**\n\n` +
    `*All active modules are operating in real-time kernel defense mode:*`
  );

  embed.addFields(
    { name: '🤖 Anti-Bot Join', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Kick Bot + Ban Inviter)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true },
    { name: '💬 Anti-Channel Delete', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Auto-Restore + Ban)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true },
    { name: '➕ Anti-Channel Create', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Delete Rogue + Ban)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true },
    { name: '🏷️ Anti-Role Delete', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Auto-Restore + Ban)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true },
    { name: '👑 Anti-Role Create', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Delete Rogue + Ban)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true },
    { name: '🔨 Anti-Mass Ban', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Auto-Unban Victim + Ban)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true },
    { name: '👢 Anti-Mass Kick', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Ban Rogue Admin)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true },
    { name: '🪝 Anti-Webhook Tamper', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Delete Webhook + Ban)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true },
    { name: '🏰 Anti-Server Tamper', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Revert Name/Icon + Ban)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true },
    { name: '✂️ Anti-Member Prune', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Ban Executor)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true },
    { name: '📢 Anti-Everyone Ping', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Delete + 1hr Timeout)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true },
    { name: '🔗 Anti-Invite Links', value: isMasterOn ? `${KikiEmojis.CHECK} Active \`(Auto-Delete Link)\`` : `${KikiEmojis.CROSS} Inactive`, inline: true }
  );

  return embed;
}

function buildControlButtons(isMasterOn) {
  const b1 = new ButtonBuilder()
    .setCustomId(isMasterOn ? 'man_disable' : 'man_enable')
    .setLabel(isMasterOn ? 'Deactivate Shield' : 'Activate All Shields')
    .setStyle(isMasterOn ? ButtonStyle.Danger : ButtonStyle.Success)
    .setEmoji(isMasterOn ? KikiEmojis.btn('cross') : KikiEmojis.btn('check'));

  const b2 = new ButtonBuilder()
    .setCustomId('man_whitelist')
    .setLabel('View Whitelist')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(KikiEmojis.btn('personal'));

  const b3 = new ButtonBuilder()
    .setCustomId('man_recovery')
    .setLabel('Security Audit Scan')
    .setStyle(ButtonStyle.Primary)
    .setEmoji(KikiEmojis.btn('fire'));

  return new ActionRowBuilder().addComponents(b1, b2, b3);
}

module.exports = {
  buildStatusEmbed,
  buildControlButtons,

  data: new SlashCommandBuilder()
    .setName('master-antinuke')
    .setDescription('🛡️ KIKI Master Anti-Nuke: Turn ON all defense shields at once')
    .addSubcommand(sub => sub.setName('enable').setDescription('Turn ON all 16+ anti-nuke shields'))
    .addSubcommand(sub => sub.setName('disable').setDescription('Turn OFF master anti-nuke'))
    .addSubcommand(sub => sub.setName('status').setDescription('View live master protection dashboard'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Ownership Required 👑', 'Sirf **Server Owner** ya **Bot Owner** hi Master Anti-Nuke ko ON / OFF kar sakte hain!\nKisi aur ke paas ye permission nahi hai.')],
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    const cfg = KIKI.loadConfig();

    if (sub === 'enable') {
      cfg.antinuke = true;
      cfg.master_antinuke = true;
      if (!cfg.antinuke_modules) cfg.antinuke_modules = {};
      cfg.antinuke_modules.anti_bot = true;
      cfg.antinuke_modules.anti_channel_delete = true;
      cfg.antinuke_modules.anti_channel_create = true;
      cfg.antinuke_modules.anti_channel_update = true;
      cfg.antinuke_modules.anti_role_delete = true;
      cfg.antinuke_modules.anti_role_create = true;
      cfg.antinuke_modules.anti_role_update = true;
      cfg.antinuke_modules.anti_ban = true;
      cfg.antinuke_modules.anti_kick = true;
      cfg.antinuke_modules.anti_webhook = true;
      cfg.antinuke_modules.anti_server_update = true;
      cfg.antinuke_modules.anti_prune = true;
      cfg.antinuke_modules.anti_everyone = true;
      cfg.antinuke_modules.anti_mass_mention = true;
      cfg.antinuke_modules.anti_invite = true;
      cfg.antinuke_modules.anti_link = true;
      cfg.punishment = 'ban';
      KIKI.saveConfig(cfg);

      const embed = buildStatusEmbed(cfg, interaction.guild);
      const row = buildControlButtons(true);
      return interaction.reply({
        content: '✅ **MASTER ANTI-NUKE SHIELD ACTIVATED!** Saare 16+ defense modules ON kar diye gaye hain!',
        embeds: [embed],
        components: [row]
      });
    }

    if (sub === 'disable') {
      cfg.antinuke = false;
      cfg.master_antinuke = false;
      KIKI.saveConfig(cfg);
      const embed = buildStatusEmbed(cfg, interaction.guild);
      const row = buildControlButtons(false);
      return interaction.reply({
        content: '⚠️ **MASTER ANTI-NUKE SHIELD DEACTIVATED!** Server security is currently paused.',
        embeds: [embed],
        components: [row]
      });
    }

    if (sub === 'status') {
      const isMasterOn = cfg.master_antinuke !== false && cfg.antinuke !== false;
      const embed = buildStatusEmbed(cfg, interaction.guild);
      const row = buildControlButtons(isMasterOn);
      return interaction.reply({ embeds: [embed], components: [row] });
    }
  },

  async handleButton(interaction, client) {
    if (!KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id)) {
      return interaction.reply({ content: '👑 Ownership Required: Sirf **Server Owner** ya **Bot Owner** hi Master Anti-Nuke toggle kar sakte hain!', ephemeral: true });
    }

    const id = interaction.customId;
    const cfg = KIKI.loadConfig();

    if (id === 'man_enable') {
      cfg.antinuke = true;
      cfg.master_antinuke = true;
      KIKI.saveConfig(cfg);
      const embed = buildStatusEmbed(cfg, interaction.guild);
      const row = buildControlButtons(true);
      return interaction.update({ content: '✅ **MASTER ANTI-NUKE ACTIVATED!**', embeds: [embed], components: [row] });
    }

    if (id === 'man_disable') {
      cfg.antinuke = false;
      cfg.master_antinuke = false;
      KIKI.saveConfig(cfg);
      const embed = buildStatusEmbed(cfg, interaction.guild);
      const row = buildControlButtons(false);
      return interaction.update({ content: '⚠️ **MASTER ANTI-NUKE DISABLED!**', embeds: [embed], components: [row] });
    }

    if (id === 'man_whitelist') {
      const wl = cfg.whitelist || [];
      const text = wl.length ? wl.map((uid, i) => `${i + 1}. <@${uid}> (\`${uid}\`)`).join('\n') : 'Abhi koi user whitelisted nahi hai.';
      const embed = KikiEmbed.purple('🛡️ KIKI Trusted Whitelist', text + '\n\nAdd karne ke liye use karein: `&whitelist add @user`');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (id === 'man_recovery') {
      await interaction.deferReply({ ephemeral: true });
      const logs = await interaction.guild.fetchAuditLogs({ limit: 15 });
      const entries = logs.entries.map(e => `• \`${e.action}\` by <@${e.executorId}>: ${e.reason || 'No reason'}`).slice(0, 8);
      const embed = KikiEmbed.purple('⚡ Recent Security Audit Inspection', entries.join('\n') || 'Audit logs clear. Server structure intact.');
      return interaction.editReply({ embeds: [embed] });
    }
  },

  name: 'master-antinuke',
  aliases: ['antinuke-master', 'man', 'masteran', 'antiruke-all'],
  async run(message, args, client) {
    if (!KIKI.isServerOrBotOwner(message.guild, message.author.id)) {
      return message.reply({ embeds: [KikiEmbed.error('Ownership Required 👑', 'Sirf **Server Owner** ya **Bot Owner** hi Master Anti-Nuke ko ON / OFF ya configure kar sakte hain!\nKisi aur ke paas ye permission nahi hai.')] });
    }

    const cfg = KIKI.loadConfig();
    const action = args[0]?.toLowerCase();

    if (action === 'enable' || action === 'on') {
      cfg.antinuke = true;
      cfg.master_antinuke = true;
      KIKI.saveConfig(cfg);
      const embed = buildStatusEmbed(cfg, message.guild);
      const row = buildControlButtons(true);
      return message.reply({ content: '✅ **MASTER ANTI-NUKE ACTIVATED!** Saare shields ON!', embeds: [embed], components: [row] });
    }

    if (action === 'disable' || action === 'off') {
      cfg.antinuke = false;
      cfg.master_antinuke = false;
      KIKI.saveConfig(cfg);
      const embed = buildStatusEmbed(cfg, message.guild);
      const row = buildControlButtons(false);
      return message.reply({ content: '⚠️ **MASTER ANTI-NUKE DISABLED!**', embeds: [embed], components: [row] });
    }

    const isMasterOn = cfg.master_antinuke !== false && cfg.antinuke !== false;
    const embed = buildStatusEmbed(cfg, message.guild);
    const row = buildControlButtons(isMasterOn);
    message.reply({ embeds: [embed], components: [row] });
  }
};
