// KIKI Bot - Command Access Control & Public Commands Setup Panel
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const config = require('../../config.js');
const KikiEmojis = require('../../utils/emojis.js');

function getPublicCommands() {
  const cfg = KIKI.loadConfig();
  return (cfg.public_commands || KIKI.DEFAULT_PUBLIC_COMMANDS).map(c => c.toLowerCase());
}

function buildPanelEmbed(statusNotice = null) {
  const publicCmds = getPublicCommands();
  const cfg = KIKI.loadConfig();
  const publicCats = (cfg.public_categories || []).map(c => c.toLowerCase());

  let cmdListStr = '';
  if (publicCmds.length === 0) {
    cmdListStr = '> *🔒 Lockdown Mode: Abhi koi bhi command public nahi hai. Sirf Whitelisted users bot use kar sakte hain.*';
  } else {
    cmdListStr = publicCmds.map(c => `\`${c}\``).join(', ');
  }

  const utilityStatus = publicCats.includes('utility') ? '🟢 Allowed' : '🔴 Whitelist Only';
  const funStatus = publicCats.includes('fun') ? '🟢 Allowed' : '🔴 Whitelist Only';
  const gamesStatus = publicCats.includes('games') ? '🟢 Allowed' : '🔴 Whitelist Only';
  const socialStatus = publicCats.includes('social') ? '🟢 Allowed' : '🔴 Whitelist Only';

  let description =
    `**Command Access & Whitelist Bypass Control**\n\n` +
    `Yahan se aap configure kar sakte hain ki **bina whitelist wale normal members** kaunsi commands use kar sakte hain (jaise \`&rank\`, \`&leaderboard\`, \`&avatar\`, etc.)!\n\n` +
    `🔓 **Allowed Public Commands (${publicCmds.length} Active):**\n${cmdListStr}\n\n` +
    `📁 **Category Wide Access:**\n` +
    `• **Utility:** ${utilityStatus} • **Fun:** ${funStatus}\n` +
    `• **Games:** ${gamesStatus} • **Social:** ${socialStatus}\n` +
    `*(🛡️ Admin, Moderation, Anti-Nuke, Nuke aur Security hamesha Whitelist-Only rahenge!)*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `**⚡ Panel Controls:**\n` +
    `• **Quick Presets:** Ek click me Voice Leveling ya Default harmless commands allow karein.\n` +
    `• **Toggle Menu:** Kisi bhi command ko directly Enable / Disable karein.\n` +
    `• **Custom Add/Remove:** Niche diye gaye buttons se koi bhi command add ya remove karein.`;

  if (statusNotice) {
    description = `${statusNotice}\n\n` + description;
  }

  const embed = KikiEmbed.build({
    title: '🎛️ KIKI • Public Commands Setup Panel',
    description,
    color: config.COLORS.PRIMARY || 0x9B59B6,
    footer: { text: `Whitelist Gatekeeper Active • KIKI v${config.BOT_VERSION}` }
  });

  return embed;
}

function buildPanelComponents() {
  const publicCmds = getPublicCommands();

  // Row 1: Presets Menu
  const presetSelect = new StringSelectMenuBuilder()
    .setCustomId('cp_preset_select')
    .setPlaceholder('⚡ Quick Presets (Ek click me access mode set karein)...')
    .addOptions([
      {
        label: '⚡ Standard Public (Recommended)',
        value: 'preset_standard',
        description: 'Rank, Leaderboard, Avatar, Banner, Ping, Help, Info allowed for everyone',
        emoji: '⭐'
      },
      {
        label: '🎙️ Voice Leveling Only',
        value: 'preset_voice',
        description: 'Sirf &rank aur &leaderboard allowed rahega normal members ke liye',
        emoji: '🔊'
      },
      {
        label: '📊 Allow All Utility & Info',
        value: 'preset_utility',
        description: 'Utility module ki saari commands bina whitelist ke allow karein',
        emoji: '📈'
      },
      {
        label: '🎭 Allow Fun & Games',
        value: 'preset_fun',
        description: 'Gothic arts, tarot, quotes aur games normal members ke liye allow karein',
        emoji: '🎲'
      },
      {
        label: '🔓 Allow All Harmless Commands',
        value: 'preset_all_harmless',
        description: 'Utility + Fun + Games + Social sabhi allowed (Admin/Mod locked rahenge)',
        emoji: '🌐'
      },
      {
        label: '🔒 Full Lockdown (Whitelist Only)',
        value: 'preset_lockdown',
        description: 'Sabhi commands lock karein. Sirf Whitelisted users bot use kar sakenge',
        emoji: '🚫'
      }
    ]);
  const row1 = new ActionRowBuilder().addComponents(presetSelect);

  // Row 2: Popular Commands Toggle
  const popularCmds = [
    { name: 'rank', label: 'rank / level', desc: 'Voice Level & Rank Card', emoji: '🎙️' },
    { name: 'leaderboard', label: 'leaderboard / vctop', desc: 'Top Voice Members Leaderboard', emoji: '🏆' },
    { name: 'avatar', label: 'avatar', desc: 'User Avatar lookup', emoji: '🖼️' },
    { name: 'banner', label: 'banner', desc: 'User Banner lookup', emoji: '🎨' },
    { name: 'serverinfo', label: 'serverinfo', desc: 'Server statistics & information', emoji: '🏰' },
    { name: 'userinfo', label: 'userinfo', desc: 'Member profile information', emoji: '👤' },
    { name: 'ping', label: 'ping', desc: 'Bot latency & ping test', emoji: '⚡' },
    { name: 'help', label: 'help', desc: 'Command library & menu', emoji: '📖' },
    { name: 'afk', label: 'afk', desc: 'AFK status setter', emoji: '💤' },
    { name: 'kikiquote', label: 'kikiquote', desc: 'Gothic persona quotes', emoji: '🔮' },
    { name: 'tarot', label: 'tarot', desc: 'Gothic tarot card reading', emoji: '🃏' },
    { name: '8ball', label: '8ball', desc: 'Crystal ball questions', emoji: '🎱' }
  ];

  const toggleOptions = popularCmds.map(c => {
    const isAllowed = publicCmds.includes(c.name);
    return {
      label: `${isAllowed ? '🟢' : '🔴'} ${c.label}`,
      value: `toggle_${c.name}`,
      description: `${isAllowed ? 'Currently: ALLOWED (Click to disable)' : 'Currently: BLOCKED (Click to enable)'}`,
      emoji: c.emoji
    };
  });

  const toggleSelect = new StringSelectMenuBuilder()
    .setCustomId('cp_toggle_cmd')
    .setPlaceholder('🎯 Specific command ko Toggle karein (Enable / Disable)...')
    .addOptions(toggleOptions);
  const row2 = new ActionRowBuilder().addComponents(toggleSelect);

  // Row 3: Action Buttons with Animated Custom Emojis
  const addBtn = new ButtonBuilder()
    .setCustomId('cp_btn_add')
    .setLabel('Add Command')
    .setStyle(ButtonStyle.Success)
    .setEmoji(KikiEmojis.btn('check'));

  const delBtn = new ButtonBuilder()
    .setCustomId('cp_btn_del')
    .setLabel('Remove Command')
    .setStyle(ButtonStyle.Danger)
    .setEmoji(KikiEmojis.btn('cross'));

  const lockdownBtn = new ButtonBuilder()
    .setCustomId('cp_btn_lockdown')
    .setLabel('Lockdown All')
    .setStyle(ButtonStyle.Danger)
    .setEmoji(KikiEmojis.btn('fire'));

  const defaultBtn = new ButtonBuilder()
    .setCustomId('cp_btn_defaults')
    .setLabel('Default Presets')
    .setStyle(ButtonStyle.Primary)
    .setEmoji(KikiEmojis.btn('sparkle'));

  const refreshBtn = new ButtonBuilder()
    .setCustomId('cp_btn_refresh')
    .setLabel('Refresh')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(KikiEmojis.btn('loading'));

  const row3 = new ActionRowBuilder().addComponents(addBtn, delBtn, lockdownBtn, defaultBtn, refreshBtn);

  return [row1, row2, row3];
}

module.exports = {
  buildPanelEmbed,
  buildPanelComponents,

  data: new SlashCommandBuilder()
    .setName('cmdpanel')
    .setDescription('🎛️ Configure which commands members can use without being whitelisted')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf **Server Owner** aur **Whitelisted members** hi Command Panel open kar sakte hain!')],
        ephemeral: true
      });
    }

    const embed = buildPanelEmbed();
    const components = buildPanelComponents();
    await interaction.reply({ embeds: [embed], components });
  },

  name: 'cmdpanel',
  aliases: ['commandpanel', 'cmdaccess', 'publiccmds', 'cmdsetup', 'publiccommands', 'cmds'],
  async run(message, args, client) {
    if (!KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf **Server Owner** aur **Whitelisted members** hi Command Panel open kar sakte hain!')]
      });
    }

    const sub = args[0]?.toLowerCase();
    const cmdArg = args[1]?.toLowerCase();

    const cfg = KIKI.loadConfig();
    if (!cfg.public_commands) cfg.public_commands = [...KIKI.DEFAULT_PUBLIC_COMMANDS];

    // ── CLI Subcommands ─────────────────────────────────────────────
    if (sub === 'add' && cmdArg) {
      const blocked = [
        'nuke', 'ban', 'kick', 'purge', 'whitelist', 'wl', 'antinuke', 'lockdown',
        'setuplogs', 'setuplevelroles', 'levelroles', 'setwelcome', 'setleave', 'prefix',
        'cmdpanel', 'commandpanel'
      ];
      if (blocked.includes(cmdArg)) {
        return message.reply({
          embeds: [KikiEmbed.error('Security Restriction', `⚠️ Command \`${cmdArg}\` administrative / dangerous hai, isko public nahi kiya ja sakta!`)]
        });
      }

      if (!cfg.public_commands.includes(cmdArg)) {
        cfg.public_commands.push(cmdArg);
        KIKI.saveConfig(cfg);
      }

      return message.reply({
        embeds: [KikiEmbed.success('Command Allowed', `✅ Command \`${cmdArg}\` ab bina whitelist wale members bhi use kar sakte hain!`)]
      });
    }

    if (sub === 'remove' || sub === 'del' && cmdArg) {
      cfg.public_commands = cfg.public_commands.filter(c => c !== cmdArg);
      KIKI.saveConfig(cfg);
      return message.reply({
        embeds: [KikiEmbed.success('Command Blocked', `🗑️ Command \`${cmdArg}\` ab sirf Whitelisted members ke liye restricted hai.`)]
      });
    }

    if (sub === 'lockdown' || sub === 'lock') {
      cfg.public_commands = [];
      cfg.public_categories = [];
      KIKI.saveConfig(cfg);
      return message.reply({
        embeds: [KikiEmbed.warn('Full Lockdown', '🔒 Saari commands lock kar di gayi hain! Ab bina whitelist ke koi command nahi chalegi.')]
      });
    }

    if (sub === 'reset' || sub === 'defaults') {
      cfg.public_commands = [...KIKI.DEFAULT_PUBLIC_COMMANDS];
      cfg.public_categories = [];
      KIKI.saveConfig(cfg);
      return message.reply({
        embeds: [KikiEmbed.success('Default Restored', '⚡ Standard harmless public commands restore kar di gayi hain.')]
      });
    }

    if (sub === 'list') {
      const list = (cfg.public_commands || []).map(c => `\`&${c}\``).join(', ') || '*None (Full Lockdown)*';
      return message.reply({
        embeds: [KikiEmbed.purple('🔓 Allowed Public Commands', `Bina whitelist wale members in commands ko use kar sakte hain:\n\n${list}`)]
      });
    }

    // Default: Open interactive panel
    const embed = buildPanelEmbed();
    const components = buildPanelComponents();
    await message.channel.send({ embeds: [embed], components });
  },

  // ── Interaction Handler (Presets, Toggles, Modals) ────────────────
  async handleInteraction(interaction, client) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf Server Owner aur Whitelisted members hi ye controls change kar sakte hain!')],
        ephemeral: true
      });
    }

    const { customId } = interaction;
    const cfg = KIKI.loadConfig();
    if (!cfg.public_commands) cfg.public_commands = [...KIKI.DEFAULT_PUBLIC_COMMANDS];
    if (!cfg.public_categories) cfg.public_categories = [];

    // 1. Presets Select
    if (customId === 'cp_preset_select' && interaction.isStringSelectMenu()) {
      const val = interaction.values[0];
      let notice = '';

      if (val === 'preset_standard') {
        cfg.public_commands = [...KIKI.DEFAULT_PUBLIC_COMMANDS];
        cfg.public_categories = [];
        notice = '⚡ **Standard Public Preset Applied!** Harmless commands (&rank, &leaderboard, &avatar, &banner, &info) sabke liye active hain.';
      } else if (val === 'preset_voice') {
        cfg.public_commands = ['rank', 'level', 'vcrank', 'vclevel', 'leaderboard', 'top', 'vctop', 'lb', 'xp'];
        cfg.public_categories = [];
        notice = '🎙️ **Voice Leveling Only Preset Applied!** Sirf \`&rank\` aur \`&leaderboard\` normal members use kar sakte hain.';
      } else if (val === 'preset_utility') {
        cfg.public_commands = [...KIKI.DEFAULT_PUBLIC_COMMANDS, 'botinfo', 'stats', 'membercount', 'uptime'];
        if (!cfg.public_categories.includes('utility')) cfg.public_categories.push('utility');
        notice = '📊 **Utility Access Enabled!** Saari diagnostic & utility commands members ke liye active ho gayi hain.';
      } else if (val === 'preset_fun') {
        cfg.public_commands = [...KIKI.DEFAULT_PUBLIC_COMMANDS, 'roll', 'coinflip', 'rps', 'roast', 'dice'];
        if (!cfg.public_categories.includes('fun')) cfg.public_categories.push('fun');
        if (!cfg.public_categories.includes('games')) cfg.public_categories.push('games');
        notice = '🎭 **Fun & Games Access Enabled!** Gothic arts, quotes, tarot aur games members ke liye open hain.';
      } else if (val === 'preset_all_harmless') {
        cfg.public_commands = [...KIKI.DEFAULT_PUBLIC_COMMANDS];
        cfg.public_categories = ['utility', 'fun', 'games', 'social'];
        notice = '🔓 **All Harmless Commands Allowed!** Utility, Fun, Games, aur Social commands sabke liye active hain. (Admin/Mod/Security locked hain).';
      } else if (val === 'preset_lockdown') {
        cfg.public_commands = [];
        cfg.public_categories = [];
        notice = '🔒 **Full Lockdown Mode Applied!** Saari public commands band kar di gayi hain. Sirf Whitelisted users hi bot use kar sakte hain.';
      }

      KIKI.saveConfig(cfg);
      const embed = buildPanelEmbed(notice);
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }

    // 2. Command Toggle Select
    if (customId === 'cp_toggle_cmd' && interaction.isStringSelectMenu()) {
      const val = interaction.values[0];
      const cmdName = val.replace('toggle_', '').toLowerCase();

      let notice = '';
      if (cfg.public_commands.includes(cmdName)) {
        cfg.public_commands = cfg.public_commands.filter(c => c !== cmdName);
        notice = `🔴 Command \`&${cmdName}\` has been **BLOCKED** for non-whitelisted members.`;
      } else {
        cfg.public_commands.push(cmdName);
        notice = `🟢 Command \`&${cmdName}\` has been **ALLOWED** for all members.`;
      }

      KIKI.saveConfig(cfg);
      const embed = buildPanelEmbed(notice);
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }

    // 3. Button: Add Command (Modal)
    if (customId === 'cp_btn_add') {
      const modal = new ModalBuilder()
        .setCustomId('cp_modal_add')
        .setTitle('Allow Public Command');

      const input = new TextInputBuilder()
        .setCustomId('add_cmd_name')
        .setLabel('Command Name (e.g. roll, math, botinfo)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('Enter command name...');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    // 4. Button: Remove Command (Modal)
    if (customId === 'cp_btn_del') {
      const modal = new ModalBuilder()
        .setCustomId('cp_modal_del')
        .setTitle('Block Public Command');

      const input = new TextInputBuilder()
        .setCustomId('del_cmd_name')
        .setLabel('Command Name to restrict to Whitelist')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('e.g. avatar, 8ball, rank...');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    // 5. Button: Lockdown All
    if (customId === 'cp_btn_lockdown') {
      cfg.public_commands = [];
      cfg.public_categories = [];
      KIKI.saveConfig(cfg);

      const notice = '🔒 **Full Lockdown Mode Activated!** Zero public commands. Sirf Whitelisted users bot chala sakte hain.';
      const embed = buildPanelEmbed(notice);
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }

    // 6. Button: Default Presets
    if (customId === 'cp_btn_defaults') {
      cfg.public_commands = [...KIKI.DEFAULT_PUBLIC_COMMANDS];
      cfg.public_categories = [];
      KIKI.saveConfig(cfg);

      const notice = '⚡ **Default Presets Restored!** Rank, Leaderboard, Avatar, Banner, Ping, Help, Userinfo are now public.';
      const embed = buildPanelEmbed(notice);
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }

    // 7. Button: Refresh
    if (customId === 'cp_btn_refresh') {
      const embed = buildPanelEmbed('🔃 Panel refreshed!');
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }

    // 8. Modal Submit: Add Command
    if (customId === 'cp_modal_add' && interaction.isModalSubmit()) {
      const cmd = interaction.fields.getTextInputValue('add_cmd_name').toLowerCase().trim();
      const blocked = [
        'nuke', 'ban', 'kick', 'purge', 'whitelist', 'wl', 'antinuke', 'lockdown',
        'setuplogs', 'setuplevelroles', 'levelroles', 'setwelcome', 'setleave', 'prefix',
        'cmdpanel', 'commandpanel'
      ];

      if (blocked.includes(cmd)) {
        return interaction.reply({
          content: `❌ Security Protection: Command \`${cmd}\` sensitive/destructive hai aur isko public nahi kiya ja sakta!`,
          ephemeral: true
        });
      }

      if (!cfg.public_commands.includes(cmd)) {
        cfg.public_commands.push(cmd);
        KIKI.saveConfig(cfg);
      }

      const notice = `✅ Command \`&${cmd}\` ko **Allowed Public Commands** me add kar diya gaya!`;
      const embed = buildPanelEmbed(notice);
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }

    // 9. Modal Submit: Remove Command
    if (customId === 'cp_modal_del' && interaction.isModalSubmit()) {
      const cmd = interaction.fields.getTextInputValue('del_cmd_name').toLowerCase().trim();
      cfg.public_commands = cfg.public_commands.filter(c => c !== cmd);
      KIKI.saveConfig(cfg);

      const notice = `🗑️ Command \`&${cmd}\` ko public access se hata diya gaya hai.`;
      const embed = buildPanelEmbed(notice);
      const components = buildPanelComponents();
      return interaction.update({ embeds: [embed], components });
    }
  }
};
