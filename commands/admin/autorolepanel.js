// KIKI Bot - Interactive Auto-Role Configuration Panel
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const config = require('../../config.js');
const KikiEmojis = require('../../utils/emojis.js');

// In-memory store for staged (pending) role selections
const stagedRoles = new Map();

function buildPanelEmbed(guild, stagedRoleId = null, notice = null) {
  const cfg = KIKI.loadConfig();
  const currentRoleId = cfg.guilds?.[guild.id]?.autorole_id || (guild.roles.cache.has(cfg.autorole_id) ? cfg.autorole_id : null);
  const currentRole = currentRoleId ? guild.roles.cache.get(currentRoleId) : null;
  const stagedRole = stagedRoleId ? guild.roles.cache.get(stagedRoleId) : null;

  const botMember = guild.members.me;
  const hasManageRoles = botMember?.permissions.has(PermissionFlagsBits.ManageRoles);

  // Status badge
  let roleStatusText = '`🔴 Not Configured (Disabled)`';
  if (currentRole) {
    roleStatusText = `<@&${currentRole.id}> (\`${currentRole.name}\` • ID: \`${currentRole.id}\`)`;
  } else if (currentRoleId) {
    roleStatusText = `\`⚠️ Configured Role ID (${currentRoleId}) server me nahi mila\``;
  }

  // Hierarchy check
  let hierarchyNotice = '';
  if (currentRole && botMember) {
    if (botMember.roles.highest.position <= currentRole.position) {
      hierarchyNotice = '\n⚠️ **Warning:** KIKI ka role is Auto-Role se **niche** hai! Server Settings > Roles me KIKI ke role ko upar move karein taaki bot role assign kar sake.';
    }
  }

  let description =
    `**Automatic Join Role System for New Members**\n\n` +
    `Jab koi naya member server join karega, KIKI use configured Auto-Role automatically assign kar dega.\n\n` +
    `⚙️ **Current Settings:**\n` +
    `• 🏷️ **Active Auto-Role:** ${roleStatusText}\n` +
    `• 🤖 **Bot Permission:** ${hasManageRoles ? '🟢 `Manage Roles: Allowed`' : '🔴 `Manage Roles: Missing Permission!`'}\n` +
    (stagedRole ? `• 🟡 **Pending Staged Role:** <@&${stagedRole.id}> *(Click "💾 Save & Apply Role" to confirm)*\n` : '') +
    hierarchyNotice +
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `**⚡ Setup Kaise Karein?**\n` +
    `1️⃣ Niche diye gaye **Role Dropdown** se wo role chunein jo naye members ko milna chahiye.\n` +
    `2️⃣ Uske baad **"💾 Save & Apply Role"** button dabayein taaki role permanently save ho jaye.\n` +
    `3️⃣ **"🧪 Test Role"** button se check karein ki bot role de pa raha hai ya nahi.`;

  if (notice) {
    description = `${notice}\n\n` + description;
  }

  const embed = KikiEmbed.build({
    title: `${KikiEmojis.SPARKLE} KIKI • Auto-Role Configuration Panel ${KikiEmojis.BUTTERFLY}`,
    description: `${KikiEmojis.header()}\n\n` + description,
    color: config.COLORS.PRIMARY || 0x9B59B6,
    footer: { text: `Auto-Role Engine • KIKI v${config.BOT_VERSION}` }
  });

  return embed;
}

function buildPanelComponents(hasStagedRole = false) {
  // Row 1: Role Select Menu
  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId('ar_role_select')
    .setPlaceholder('🏷️ Step 1: Naye members ke liye role select karein...')
    .setMinValues(1)
    .setMaxValues(1);
  const row1 = new ActionRowBuilder().addComponents(roleSelect);

  // Row 2: Control Buttons with Animated Custom Emojis
  const saveBtn = new ButtonBuilder()
    .setCustomId('ar_btn_save')
    .setLabel('Save & Apply Role')
    .setStyle(hasStagedRole ? ButtonStyle.Success : ButtonStyle.Primary)
    .setEmoji(KikiEmojis.btn('check'));

  const disableBtn = new ButtonBuilder()
    .setCustomId('ar_btn_disable')
    .setLabel('Disable Auto-Role')
    .setStyle(ButtonStyle.Danger)
    .setEmoji(KikiEmojis.btn('cross'));

  const testBtn = new ButtonBuilder()
    .setCustomId('ar_btn_test')
    .setLabel('Test Role')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(KikiEmojis.btn('sparkle'));

  const refreshBtn = new ButtonBuilder()
    .setCustomId('ar_btn_refresh')
    .setLabel('Refresh')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(KikiEmojis.btn('loading'));

  const row2 = new ActionRowBuilder().addComponents(saveBtn, disableBtn, testBtn, refreshBtn);

  return [row1, row2];
}

module.exports = {
  buildPanelEmbed,
  buildPanelComponents,

  data: new SlashCommandBuilder()
    .setName('autorolepanel')
    .setDescription('🏷️ Open Auto-Role setup panel (Select role & save with 1-click button)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf **Server Owner** ya **Whitelisted members** Auto-Role panel use kar sakte hain!')],
        ephemeral: true
      });
    }

    const embed = buildPanelEmbed(interaction.guild);
    const components = buildPanelComponents(false);

    await interaction.reply({ embeds: [embed], components });
  },

  name: 'autorolepanel',
  aliases: ['autorole', 'arpanel', 'autorolesetup', 'autorole-panel'],
  async run(message, args, client) {
    if (!KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf **Server Owner** ya **Whitelisted members** Auto-Role panel use kar sakte hain!')]
      });
    }

    const embed = buildPanelEmbed(message.guild);
    const components = buildPanelComponents(false);

    await message.reply({ embeds: [embed], components });
  },

  // ── Component Interaction Handler ─────────────────────────────
  async handleInteraction(interaction, client) {
    const guild = interaction.guild;
    const user = interaction.user;

    if (!guild) return;

    if (!KIKI.isSafe(guild, user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Aapke paas is panel ko control karne ki permission nahi hai!')],
        ephemeral: true
      });
    }

    const customId = interaction.customId;

    // 1. Role Select Menu Triggered
    if (interaction.isRoleSelectMenu() && customId === 'ar_role_select') {
      const selectedRoleId = interaction.values[0];
      const role = guild.roles.cache.get(selectedRoleId);

      if (!role) {
        return interaction.reply({
          embeds: [KikiEmbed.error('Role Error', 'Chuna gaya role server me nahi mila!')],
          ephemeral: true
        });
      }

      if (role.id === guild.roles.everyone.id) {
        return interaction.reply({
          embeds: [KikiEmbed.error('Invalid Role', '`@everyone` role ko Auto-Role nahi banaya ja sakta!')],
          ephemeral: true
        });
      }

      if (role.managed) {
        return interaction.reply({
          embeds: [KikiEmbed.error('Managed Role', 'Bot integration ya booster managed roles ko assign nahi kiya ja sakta!')],
          ephemeral: true
        });
      }

      const botMember = guild.members.me;
      if (botMember && botMember.roles.highest.position <= role.position) {
        return interaction.reply({
          embeds: [KikiEmbed.warn(
            'Role Hierarchy Warning ⚠️',
            `Bot ka role <@&${role.id}> role se **niche** hai!\nServer Settings > Roles me KIKI ke role ko <@&${role.id}> ke upar drag karein taaki bot ise members ko assign kar sake.`
          )],
          ephemeral: true
        });
      }

      // Stage role for confirmation
      stagedRoles.set(guild.id, role.id);

      const notice = `🟡 **Role Selected:** <@&${role.id}>!\nAb niche diye gaye **"💾 Save & Apply Role"** button par click karein taaki ye permanently save ho jaye.`;
      const embed = buildPanelEmbed(guild, role.id, notice);
      const components = buildPanelComponents(true);

      await interaction.update({ embeds: [embed], components });
      return;
    }

    // 2. Button Actions
    if (interaction.isButton()) {
      if (customId === 'ar_btn_save') {
        const stagedRoleId = stagedRoles.get(guild.id);
        const cfg = KIKI.loadConfig();
        const currentGuildRoleId = cfg.guilds?.[guild.id]?.autorole_id || (guild.roles.cache.has(cfg.autorole_id) ? cfg.autorole_id : null);

        if (!stagedRoleId) {
          if (currentGuildRoleId) {
            return interaction.reply({
              embeds: [KikiEmbed.warn('Already Saved', `Auto-Role pehle se hi <@&${currentGuildRoleId}> par configured hai! Naya role change karne ke liye pehle dropdown se role chunein.`)],
              ephemeral: true
            });
          }
          return interaction.reply({
            embeds: [KikiEmbed.warn('No Role Selected', 'Pehle Step 1 me **Role Dropdown** se ek role select karein, fir Save button dabayein!')],
            ephemeral: true
          });
        }

        const role = guild.roles.cache.get(stagedRoleId);
        if (!role) {
          stagedRoles.delete(guild.id);
          return interaction.reply({
            embeds: [KikiEmbed.error('Role Missing', 'Staged role server me nahi mila!')],
            ephemeral: true
          });
        }

        // Commit to persistent configuration (isolated per guild)
        if (!cfg.guilds) cfg.guilds = {};
        if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
        cfg.guilds[guild.id].autorole_id = role.id;
        if (!cfg.autorole_id) cfg.autorole_id = role.id;
        KIKI.saveConfig(cfg);
        stagedRoles.delete(guild.id);

        const notice = `✅ **Auto-Role Successfully Saved & Applied!**\nNaye aane wale members ko automatically <@&${role.id}> role diya jayega! 🎉`;
        const embed = buildPanelEmbed(guild, null, notice);
        const components = buildPanelComponents(false);

        await interaction.update({ embeds: [embed], components });
        return;
      }

      if (customId === 'ar_btn_disable') {
        const cfg = KIKI.loadConfig();
        if (!cfg.guilds) cfg.guilds = {};
        if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
        cfg.guilds[guild.id].autorole_id = null;
        KIKI.saveConfig(cfg);
        stagedRoles.delete(guild.id);

        const notice = '🚫 **Auto-Role Disabled!**\nNaye members ko ab koi auto-role nahi diya jayega.';
        const embed = buildPanelEmbed(guild, null, notice);
        const components = buildPanelComponents(false);

        await interaction.update({ embeds: [embed], components });
        return;
      }

      if (customId === 'ar_btn_test') {
        const cfg = KIKI.loadConfig();
        const roleId = cfg.guilds?.[guild.id]?.autorole_id || (guild.roles.cache.has(cfg.autorole_id) ? cfg.autorole_id : null);
        if (!roleId) {
          return interaction.reply({
            embeds: [KikiEmbed.warn('No Auto-Role Configured', 'Test karne ke liye pehle dropdown se role select karke **Save & Apply** karein!')],
            ephemeral: true
          });
        }

        const role = guild.roles.cache.get(roleId);
        if (!role) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Role Missing', `Configured role ID \`${roleId}\` server me nahi mila!`)],
            ephemeral: true
          });
        }

        const botMember = guild.members.me;
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Missing Permission', 'Bot ke paas **Manage Roles** permission nahi hai!')],
            ephemeral: true
          });
        }

        if (botMember.roles.highest.position <= role.position) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Hierarchy Error', `Bot ka highest role <@&${role.id}> se niche hai! Bot role ko Server Settings > Roles me upar drag karein.`)],
            ephemeral: true
          });
        }

        // Test assign to member
        try {
          const member = interaction.member;
          const hadRole = member.roles.cache.has(role.id);
          if (hadRole) {
            await member.roles.remove(role, '[KIKI Auto-Role] Test role toggle');
            return interaction.reply({
              embeds: [KikiEmbed.success('Test Successful 🧪', `Aapke paas pehle se <@&${role.id}> role tha, bot ne test me use successfully **remove** kar diya!\nPermissions bilkul sahi kaam kar rahi hain.`)],
              ephemeral: true
            });
          } else {
            await member.roles.add(role, '[KIKI Auto-Role] Test role toggle');
            return interaction.reply({
              embeds: [KikiEmbed.success('Test Successful 🧪', `Bot ne aapko <@&${role.id}> role successfully **assign** kar diya!\nPermissions bilkul sahi kaam kar rahi hain.`)],
              ephemeral: true
            });
          }
        } catch (err) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Test Failed', `Bot role assign nahi kar saka: \`${err.message}\``)],
            ephemeral: true
          });
        }
      }

      if (customId === 'ar_btn_refresh') {
        const stagedRoleId = stagedRoles.get(guild.id);
        const embed = buildPanelEmbed(guild, stagedRoleId, '🔃 Panel refreshed!');
        const components = buildPanelComponents(Boolean(stagedRoleId));

        await interaction.update({ embeds: [embed], components });
        return;
      }
    }
  }
};
