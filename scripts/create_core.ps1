# PowerShell script to create core KIKI commands cleanly with literal strings

$base = "C:\Users\BILLU\.gemini\antigravity\scratch\bitzxier-bot\commands"

function Write-CmdFile($relPath, [string]$content) {
    $full = Join-Path $base $relPath
    $dir = Split-Path $full -Parent
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $content.Trim() + "`r`n", [System.Text.Encoding]::UTF8)
    Write-Host "Created: $relPath"
}

# 1. ANTINUKE
Write-CmdFile "antinuke/antinuke.js" @'
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const fs = require('fs');
const path = require('path');

function getCfg() {
  const p = path.join(__dirname, '../../data/config.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}
function saveCfg(d) {
  const p = path.join(__dirname, '../../data/config.json');
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antinuke')
    .setDescription('🛡️ KIKI Anti-Nuke security system configure karo')
    .addSubcommand(sub => sub.setName('enable').setDescription('Turn Anti-Nuke ON'))
    .addSubcommand(sub => sub.setName('disable').setDescription('Turn Anti-Nuke OFF'))
    .addSubcommand(sub => sub.setName('status').setDescription('View current Anti-Nuke status'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isOwner(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({ embeds: [KikiEmbed.error('Access Denied', 'Sirf Server Owner ya Bot Owner hi Anti-Nuke switch kar sakte hain!')], ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const cfg = getCfg();

    if (sub === 'enable') {
      cfg.antinuke = true;
      saveCfg(cfg);
      const embed = KikiEmbed.purple('Anti-Nuke Activated 🛡️', '✅ **Anti-Nuke successfully ENABLED!**\nServer is now under KIKI Gothic Shield protection.\n\n• Anti-Bot Protection: **ACTIVE**\n• Anti-Channel Delete: **ACTIVE**\n• Anti-Role Delete: **ACTIVE**\n• Anti-Ban / Mass-Ban: **ACTIVE**');
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'disable') {
      cfg.antinuke = false;
      saveCfg(cfg);
      const embed = KikiEmbed.warn('Anti-Nuke Deactivated', '⚠️ **Anti-Nuke has been DISABLED!**\nServer protection is now OFF.');
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'status') {
      const status = cfg.antinuke ? '🟢 **ENABLED**' : '🔴 **DISABLED**';
      const wlCount = (cfg.whitelist || []).length;
      const embed = KikiEmbed.purple('KIKI Anti-Nuke Status 🛡️', `**Status:** ${status}\n**Whitelisted Users:** ${wlCount}\n**Bot Mode:** Gothic Purple Security Shield v2.2`);
      return interaction.reply({ embeds: [embed] });
    }
  },

  name: 'antinuke',
  aliases: ['an', 'security'],
  async run(message, args, client) {
    if (!KIKI.isOwner(message.author.id) && message.guild.ownerId !== message.author.id) return;
    const cfg = getCfg();
    const action = args[0]?.toLowerCase();
    if (action === 'enable' || action === 'on') {
      cfg.antinuke = true;
      saveCfg(cfg);
      return message.reply({ embeds: [KikiEmbed.purple('Anti-Nuke Activated 🛡️', '✅ Anti-Nuke ENABLED!')] });
    } else if (action === 'disable' || action === 'off') {
      cfg.antinuke = false;
      saveCfg(cfg);
      return message.reply({ embeds: [KikiEmbed.warn('Anti-Nuke Disabled', '⚠️ Anti-Nuke DISABLED!')] });
    }
    const status = cfg.antinuke ? '🟢 ENABLED' : '🔴 DISABLED';
    message.reply({ embeds: [KikiEmbed.purple('Anti-Nuke Status', `Status: ${status}\nUse: \`&antinuke enable\` ya \`&antinuke disable\``)] });
  }
};
'@

# 2. WHITELIST
Write-CmdFile "antinuke/whitelist.js" @'
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const fs = require('fs');
const path = require('path');

function getCfg() {
  const p = path.join(__dirname, '../../data/config.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}
function saveCfg(d) {
  const p = path.join(__dirname, '../../data/config.json');
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('🛡️ Anti-Nuke whitelist manage karo')
    .addSubcommand(sub => sub.setName('add').setDescription('Add member to whitelist').addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove member from whitelist').addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('Show whitelisted members'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isOwner(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({ embeds: [KikiEmbed.error('Access Denied', 'Sirf Server Owner whitelist change kar sakta hai!')], ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const cfg = getCfg();
    if (!cfg.whitelist) cfg.whitelist = [];

    if (sub === 'add') {
      const user = interaction.options.getUser('user');
      if (cfg.whitelist.includes(user.id)) return interaction.reply({ embeds: [KikiEmbed.warn('Already Whitelisted', `${user.tag} pehle se whitelist mein hai.`)], ephemeral: true });
      cfg.whitelist.push(user.id);
      saveCfg(cfg);
      return interaction.reply({ embeds: [KikiEmbed.success('Whitelist Added', `✅ **${user.tag}** ko KIKI Anti-Nuke Whitelist mein add kar diya gaya hai.`)] });
    }

    if (sub === 'remove') {
      const user = interaction.options.getUser('user');
      if (!cfg.whitelist.includes(user.id)) return interaction.reply({ embeds: [KikiEmbed.warn('Not Found', `${user.tag} whitelist mein nahi hai.`)], ephemeral: true });
      cfg.whitelist = cfg.whitelist.filter(id => id !== user.id);
      saveCfg(cfg);
      return interaction.reply({ embeds: [KikiEmbed.success('Whitelist Removed', `🗑️ **${user.tag}** ko whitelist se hata diya gaya hai.`)] });
    }

    if (sub === 'list') {
      if (cfg.whitelist.length === 0) return interaction.reply({ embeds: [KikiEmbed.info('Whitelist Empty', 'Abhi koi bhi user whitelisted nahi hai.')] });
      const list = cfg.whitelist.map((id, i) => `${i + 1}. <@${id}> (${id})`).join('\n');
      return interaction.reply({ embeds: [KikiEmbed.purple('🛡️ Whitelisted Users', list)] });
    }
  },

  name: 'whitelist',
  aliases: ['wl'],
  async run(message, args, client) {
    if (!KIKI.isOwner(message.author.id) && message.guild.ownerId !== message.author.id) return;
    const cfg = getCfg();
    if (!cfg.whitelist) cfg.whitelist = [];
    const action = args[0]?.toLowerCase();
    const user = message.mentions.users.first();

    if (action === 'add' && user) {
      if (!cfg.whitelist.includes(user.id)) cfg.whitelist.push(user.id);
      saveCfg(cfg);
      return message.reply({ embeds: [KikiEmbed.success('Whitelist Added', `${user.tag} added to whitelist.`)] });
    } else if (action === 'remove' && user) {
      cfg.whitelist = cfg.whitelist.filter(id => id !== user.id);
      saveCfg(cfg);
      return message.reply({ embeds: [KikiEmbed.success('Whitelist Removed', `${user.tag} removed.`)] });
    } else if (action === 'list' || !action) {
      const list = cfg.whitelist.map(id => `<@${id}>`).join('\n') || 'None';
      return message.reply({ embeds: [KikiEmbed.purple('Whitelisted Users', list)] });
    }
  }
};
'@

# 3. TICKET SYSTEM
Write-CmdFile "utility/ticket.js" @'
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');

function getCfg() {
  const p = path.join(__dirname, '../../data/config.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎫 Support Ticket commands')
    .addSubcommand(s => s.setName('panel').setDescription('Send interactive ticket creation panel'))
    .addSubcommand(s => s.setName('close').setDescription('Close current ticket'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'panel') {
      const openBtn = new ButtonBuilder().setCustomId('open_ticket_btn').setLabel('Open Ticket').setStyle(ButtonStyle.Primary).setEmoji('📩');
      const row = new ActionRowBuilder().addComponents(openBtn);

      const embed = KikiEmbed.purple('🎫 KIKI Support & Ticket Center',
        'Agar aapko server me koi help chahiye ya staff se baat karni hai, toh niche diye gaye **Open Ticket** button par click karein!\n\nEk private channel open ho jayega jahan sirf aap aur server staff honge.'
      );
      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (sub === 'close') {
      if (!interaction.channel.name.startsWith('ticket-')) {
        return interaction.reply({ embeds: [KikiEmbed.error('Not a Ticket', 'Ye channel ticket channel nahi hai!')], ephemeral: true });
      }
      await interaction.reply('⚠️ Ye ticket 5 seconds mein close ho jayega...');
      setTimeout(async () => {
        try { await interaction.channel.delete('Ticket closed by user/staff'); } catch {}
      }, 5000);
    }
  },

  async handleButton(interaction, client) {
    const cfg = getCfg();
    const guild = interaction.guild;
    const channelName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    const existing = guild.channels.cache.find(c => c.name === channelName);
    if (existing) {
      return interaction.reply({ content: `❌ Aapka ticket pehle se open hai: ${existing.toString()}`, ephemeral: true });
    }

    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
      { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
    ];

    if (cfg.staff_role_id) {
      overwrites.push({ id: cfg.staff_role_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
    }

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: cfg.ticket_category_id || null,
      permissionOverwrites: overwrites,
      reason: `Ticket created for ${interaction.user.tag}`
    });

    const closeBtn = new ButtonBuilder().setCustomId('close_ticket_btn').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒');
    const row = new ActionRowBuilder().addComponents(closeBtn);

    const embed = KikiEmbed.purple('🎫 Support Ticket Opened',
      `Namaste ${interaction.user.toString()}!\nStaff jald hi aapse yahan connect karega.\nApni query detail mein likhein.\n\nTicket close karne ke liye niche diya gaya **Close Ticket** button dabayein.`
    );

    await ticketChannel.send({ content: interaction.user.toString(), embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Aapka ticket create ho gaya hai: ${ticketChannel.toString()}`, ephemeral: true });
  },

  name: 'ticket',
  aliases: ['tickets'],
  async run(message, args, client) {
    const openBtn = new ButtonBuilder().setCustomId('open_ticket_btn').setLabel('Open Ticket').setStyle(ButtonStyle.Primary).setEmoji('📩');
    const row = new ActionRowBuilder().addComponents(openBtn);
    const embed = KikiEmbed.purple('🎫 KIKI Support & Ticket Center', 'Click **Open Ticket** to connect with staff.');
    message.channel.send({ embeds: [embed], components: [row] });
  }
};
'@

# 4. HELP MENU
Write-CmdFile "utility/help.js" @'
const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('🔮 View KIKI Gothic Purple command library and help menu')
    .addStringOption(o => o.setName('category').setDescription('Specific category to inspect')),

  async execute(interaction, client) {
    const embed = KikiEmbed.purple('「 KIKI 」• Gothic Utility & Anti-Nuke Library 🔮',
      `Welcome to **KIKI v${config.BOT_VERSION}**\n*Gothic Purple Discord Bot | Bitzxier JS Replica*\n\nNiche diye gaye dropdown menu se category select karein aur saare commands explore karein!\n\n**Prefix:** \`${config.PREFIX}\` | **Slash Commands:** \`/<cmd>\``
    )
    .addFields(
      { name: '🛡️ Anti-Nuke & Security', value: '15+ automated defense engines & whitelist', inline: true },
      { name: '🔨 Moderation', value: 'Ban, Kick, Timeout, Purge, Lock, Warn', inline: true },
      { name: '🎫 Ticket System', value: 'Interactive Discord Button UI', inline: true },
      { name: '⚙️ Server Setup', value: 'Welcome, Auto-role, Logging, Prefix', inline: true },
      { name: '📊 Utility & Info', value: 'Userinfo, Serverinfo, Avatar, Ping', inline: true },
      { name: '🎭 Gothic Fun & Arts', value: 'Tarot, Quotes, 8ball, Games', inline: true }
    );

    const select = new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('🔮 Select a Command Category...')
      .addOptions([
        { label: 'Anti-Nuke & Security', description: 'Server protection, whitelist, recovery', value: 'cat_antinuke', emoji: '🛡️' },
        { label: 'Moderation', description: 'Ban, kick, timeout, purge, mute', value: 'cat_moderation', emoji: '🔨' },
        { label: 'Tickets & Setup', description: 'Interactive button tickets & welcome setup', value: 'cat_tickets', emoji: '🎫' },
        { label: 'Utility & Tools', description: 'Serverinfo, userinfo, avatar, banner, ping', value: 'cat_utility', emoji: '📊' },
        { label: 'Gothic Fun & Arts', description: 'Tarot, dark quotes, games & aesthetics', value: 'cat_fun', emoji: '🎭' },
        { label: 'Server Management', description: 'Mass tools, lockdown, cleanup utilities', value: 'cat_server', emoji: '👑' }
      ]);

    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({ embeds: [embed], components: [row] });
  },

  async handleSelect(interaction, client) {
    const val = interaction.values[0];
    let embed;

    if (val === 'cat_antinuke') {
      embed = KikiEmbed.purple('🛡️ Anti-Nuke & Security Commands',
        '`/antinuke enable` - Activate full Anti-Nuke shield\n' +
        '`/antinuke disable` - Turn off Anti-Nuke\n' +
        '`/antinuke status` - Check shield status\n' +
        '`/whitelist add <user>` - Whitelist trusted user\n' +
        '`/whitelist remove <user>` - Remove user from whitelist\n' +
        '`/whitelisted` - List all whitelisted members\n' +
        '`/antibot` - Block rogue bots from joining\n' +
        '`/antichannel` - Auto-recreate deleted channels\n' +
        '`/antirole` - Auto-ban rogue role deleters\n' +
        '`/antiban` - Auto-unban from mass ban attack\n' +
        '`/antikick` - Punish rogue kick attacks\n' +
        '`/antiwebhook` - Prevent malicious webhooks\n' +
        '`/recovery` - Revert server damage'
      );
    } else if (val === 'cat_moderation') {
      embed = KikiEmbed.purple('🔨 Moderation Commands',
        '`/ban <user> [reason]` - Ban member\n' +
        '`/unban <user_id>` - Unban by ID\n' +
        '`/kick <user> [reason]` - Kick member\n' +
        '`/timeout <user> <mins>` - Timeout/mute member\n' +
        '`/untimeout <user>` - Remove timeout\n' +
        '`/purge <amount>` - Bulk delete messages\n' +
        '`/lock` / `/unlock` - Lock or unlock current channel\n' +
        '`/hide` / `/unhide` - Hide channel from @everyone\n' +
        '`/slowmode <seconds>` - Set channel slowmode\n' +
        '`/warn <user> <reason>` - Issue warning to user\n' +
        '`/warnings <user>` - View member warnings\n' +
        '`/clearwarnings <user>` - Clear warnings\n' +
        '`/nuke` - Clone and wipe clean current channel'
      );
    } else if (val === 'cat_tickets') {
      embed = KikiEmbed.purple('🎫 Ticket & Server Setup',
        '`/ticket panel` - Deploy button ticket launcher\n' +
        '`/ticket close` - Close active ticket channel\n' +
        '`/setwelcome <#channel>` - Set welcome channel\n' +
        '`/setautorole <@role>` - Set role given on member join\n' +
        '`/setticketstaff <@role>` - Staff role for tickets\n' +
        '`/setticketcategory <id>` - Category for tickets\n' +
        '`/setlog <#channel>` - Set moderation audit log'
      );
    } else if (val === 'cat_utility') {
      embed = KikiEmbed.purple('📊 Utility & Info Commands',
        '`/ping` - Bot and gateway latency\n' +
        '`/avatar [user]` - View high-res avatar\n' +
        '`/banner [user]` - View user or server banner\n' +
        '`/userinfo [user]` - View user details and roles\n' +
        '`/serverinfo` - View server stats and specs\n' +
        '`/botinfo` - KIKI system information\n' +
        '`/uptime` - Bot uptime and stats\n' +
        '`/membercount` - Member count breakdown\n' +
        '`/afk [reason]` - Set AFK status\n' +
        '`/poll <question>` - Create interactive poll'
      );
    } else if (val === 'cat_fun') {
      embed = KikiEmbed.purple('🎭 Gothic Arts & Fun',
        '`/kikiquote` - Arcane quote from KIKI persona\n' +
        '`/tarot` - Draw a gothic tarot card\n' +
        '`/8ball <question>` - Dark mystic magic 8-ball\n' +
        '`/coinflip` - Flip a gothic coin\n' +
        '`/roll [dice]` - Roll dice\n' +
        '`/rps <choice>` - Rock Paper Scissors\n' +
        '`/roast [user]` - Gothic roast'
      );
    } else {
      embed = KikiEmbed.purple('👑 Server Management Tools',
        '`/lock-all` - Emergency lock all channels\n' +
        '`/unlock-all` - Unlock all channels\n' +
        '`/slowmode-all <secs>` - Set slowmode everywhere\n' +
        '`/nick-all [name]` - Change nicknames in bulk\n' +
        '`/purge-bots` - Remove unauthorized bots\n' +
        '`/mass-unban` - Unban all banned users'
      );
    }

    await interaction.update({ embeds: [embed] });
  },

  name: 'help',
  aliases: ['h', 'commands'],
  async run(message) {
    const embed = KikiEmbed.purple('「 KIKI 」• Gothic Utility v2.2',
      'Use `/help` for interactive category viewer.\n\n' +
      '**Categories:**\n' +
      '• `&antinuke` - Anti-Nuke shield & whitelist\n' +
      '• `&ban`, `&kick`, `&timeout`, `&purge` - Moderation\n' +
      '• `&ticketsetup` - Deploy ticket button panel\n' +
      '• `&userinfo`, `&serverinfo`, `&ping`, `&avatar` - Utility'
    );
    message.reply({ embeds: [embed] });
  }
};
'@

# 5. PING
Write-CmdFile "utility/ping.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('🏓 KIKI bot and WebSocket latency check karo'),
  async execute(interaction, client) {
    const sent = await interaction.reply({ embeds: [KikiEmbed.purple('Pinging...', '🔮 Consulting the void...')], fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const ws = client.ws.ping;
    const embed = KikiEmbed.purple('🏓 Pong! | KIKI Gothic Utility', `**Roundtrip Latency:** \`${latency}ms\`\n**WebSocket Heartbeat:** \`${ws}ms\`\n**Status:** 🔮 All Dark Systems Functional`);
    await interaction.editReply({ embeds: [embed] });
  },
  name: 'ping', aliases: ['latency', 'p'],
  async run(message, args, client) {
    const ws = client.ws.ping;
    message.reply({ embeds: [KikiEmbed.purple('🏓 Pong!', `WebSocket Ping: \`${ws}ms\``)] });
  }
};
'@

# 6. AVATAR
Write-CmdFile "utility/avatar.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('avatar').setDescription('🖼️ View user avatar')
    .addUserOption(o => o.setName('user').setDescription('Target user')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const png = user.displayAvatarURL({ extension: 'png', size: 1024 });
    const embed = KikiEmbed.purple(`${user.username}'s Avatar`, `[PNG](${png}) | [JPG](${user.displayAvatarURL({ extension: 'jpg' })}) | [WEBP](${user.displayAvatarURL({ extension: 'webp' })})`)
      .setImage(png);
    await interaction.reply({ embeds: [embed] });
  },
  name: 'avatar', aliases: ['av', 'pfp'],
  async run(message, args) {
    const user = message.mentions.users.first() || message.author;
    const png = user.displayAvatarURL({ extension: 'png', size: 1024 });
    message.reply({ embeds: [KikiEmbed.purple(`${user.username}'s Avatar`).setImage(png)] });
  }
};
'@

# 7. SERVERINFO
Write-CmdFile "utility/serverinfo.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('🏰 Server statistics & information'),
  async execute(interaction) {
    const g = interaction.guild;
    const owner = await g.fetchOwner();
    const embed = KikiEmbed.purple(`Server Info - ${g.name}`, `ID: \`${g.id}\``)
      .setThumbnail(g.iconURL({ dynamic: true }))
      .addFields(
        { name: '👑 Owner', value: `${owner.user.tag} (<@${g.ownerId}>)`, inline: true },
        { name: '👥 Members', value: `${g.memberCount}`, inline: true },
        { name: '✨ Boost Level', value: `Level ${g.premiumTier} (${g.premiumSubscriptionCount} boosts)`, inline: true },
        { name: '💬 Channels', value: `${g.channels.cache.size}`, inline: true },
        { name: '🏷️ Roles', value: `${g.roles.cache.size}`, inline: true },
        { name: '📅 Created On', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'serverinfo', aliases: ['si'],
  async run(message) {
    const g = message.guild;
    message.reply({ embeds: [KikiEmbed.purple(`Server Info - ${g.name}`).addFields({ name: 'Members', value: `${g.memberCount}`, inline: true })] });
  }
};
'@

# 8. USERINFO
Write-CmdFile "utility/userinfo.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('userinfo').setDescription('👤 Detailed user information')
    .addUserOption(o => o.setName('user').setDescription('Target user')),
  async execute(interaction) {
    const member = interaction.options.getMember('user') || interaction.member;
    const user = member.user;
    const roles = member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).slice(0, 15);
    const embed = KikiEmbed.purple(`User Info - ${user.tag}`, `ID: \`${user.id}\``)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '📅 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: '📆 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '🤖 Is Bot', value: user.bot ? 'Yes' : 'No', inline: true },
        { name: `🏷️ Roles (${member.roles.cache.size - 1})`, value: roles.length ? roles.join(' ') : 'None', inline: false }
      );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'userinfo', aliases: ['ui', 'whois'],
  async run(message, args) {
    const member = message.mentions.members.first() || message.member;
    const user = member.user;
    const embed = KikiEmbed.purple(`User Info - ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Joined', value: member.joinedAt.toDateString(), inline: true }
      );
    message.reply({ embeds: [embed] });
  }
};
'@

# 9. BOTINFO
Write-CmdFile "utility/botinfo.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const config = require('../../config.js');
module.exports = {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('🔮 KIKI Bot information and specifications'),
  async execute(interaction, client) {
    const embed = KikiEmbed.purple('「 KIKI 」• System Specs', config.BOT_TAGLINE)
      .addFields(
        { name: 'Version', value: `v${config.BOT_VERSION} JS Edition`, inline: true },
        { name: 'Library', value: 'Discord.js v14.15.3', inline: true },
        { name: 'Node.js', value: process.version, inline: true },
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Total Commands', value: `${client.totalCommands || '800+'}`, inline: true },
        { name: 'Theme', value: 'Gothic Purple (#9B59B6)', inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'botinfo', aliases: ['bi', 'stats', 'kikiinfo'],
  async run(message, args, client) {
    message.reply({ embeds: [KikiEmbed.purple('KIKI Specs', `Version: v${config.BOT_VERSION} | Node: ${process.version}`)] });
  }
};
'@

Write-Host "Core commands successfully created!"
