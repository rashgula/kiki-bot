# PowerShell script to create additional KIKI commands

$base = "C:\Users\BILLU\.gemini\antigravity\scratch\bitzxier-bot\commands"

function Write-CmdFile($relPath, [string]$content) {
    $full = Join-Path $base $relPath
    $dir = Split-Path $full -Parent
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $content.Trim() + "`r`n", [System.Text.Encoding]::UTF8)
    Write-Host "Created: $relPath"
}

# 1. ADMIN COMMANDS
Write-CmdFile "admin/setwelcome.js" @'
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
function getCfg() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8')); }
function saveCfg(d) { fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('setwelcome').setDescription('👋 Welcome channel set karo')
    .addChannelOption(o => o.setName('channel').setDescription('Welcome channel').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const ch = interaction.options.getChannel('channel');
    const cfg = getCfg();
    cfg.welcome_channel_id = ch.id;
    saveCfg(cfg);
    await interaction.reply({ embeds: [KikiEmbed.success('Welcome Channel Set', `✅ Welcome messages will now be sent in ${ch.toString()}`)] });
  },
  name: 'setwelcome', aliases: ['welcomechannel'],
  async run(message) {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply('Channel mention karo!');
    const cfg = getCfg();
    cfg.welcome_channel_id = ch.id;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Welcome Set', `Set to ${ch.toString()}`)] });
  }
};
'@

Write-CmdFile "admin/setautorole.js" @'
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
function getCfg() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8')); }
function saveCfg(d) { fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('setautorole').setDescription('🏷️ Automatic join role set karo')
    .addRoleOption(o => o.setName('role').setDescription('Role given on join').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const cfg = getCfg();
    cfg.autorole_id = role.id;
    saveCfg(cfg);
    await interaction.reply({ embeds: [KikiEmbed.success('Auto-Role Set', `✅ New members will automatically receive **@${role.name}**`)] });
  },
  name: 'setautorole', aliases: ['autorole-set'],
  async run(message) {
    const role = message.mentions.roles.first();
    if (!role) return message.reply('Role mention karo!');
    const cfg = getCfg();
    cfg.autorole_id = role.id;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Auto-Role', `Set to ${role.name}`)] });
  }
};
'@

Write-CmdFile "admin/setticketstaff.js" @'
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
function getCfg() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8')); }
function saveCfg(d) { fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('setticketstaff').setDescription('🎫 Set Ticket Staff Role')
    .addRoleOption(o => o.setName('role').setDescription('Staff role').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const cfg = getCfg();
    cfg.staff_role_id = role.id;
    saveCfg(cfg);
    await interaction.reply({ embeds: [KikiEmbed.success('Ticket Staff Set', `✅ Ticket Staff set to **@${role.name}**`)] });
  },
  name: 'setticketstaff', aliases: [],
  async run(message) {
    const role = message.mentions.roles.first();
    if (!role) return;
    const cfg = getCfg();
    cfg.staff_role_id = role.id;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Staff Role', `Set to ${role.name}`)] });
  }
};
'@

Write-CmdFile "admin/setticketcategory.js" @'
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
function getCfg() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8')); }
function saveCfg(d) { fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('setticketcategory').setDescription('🎫 Set Category for newly created tickets')
    .addChannelOption(o => o.setName('category').setDescription('Category').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const cat = interaction.options.getChannel('category');
    const cfg = getCfg();
    cfg.ticket_category_id = cat.id;
    saveCfg(cfg);
    await interaction.reply({ embeds: [KikiEmbed.success('Ticket Category Set', `✅ New tickets will be opened under **${cat.name}**`)] });
  },
  name: 'setticketcategory', aliases: [],
  async run(message, args) {
    const id = args[0];
    if (!id) return;
    const cfg = getCfg();
    cfg.ticket_category_id = id;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Ticket Category', `Set to ${id}`)] });
  }
};
'@

Write-CmdFile "admin/ticketsetup.js" @'
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('ticketsetup').setDescription('🎫 Deploy Interactive Support Ticket Panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const openBtn = new ButtonBuilder().setCustomId('open_ticket_btn').setLabel('Open Ticket').setStyle(ButtonStyle.Primary).setEmoji('📩');
    const row = new ActionRowBuilder().addComponents(openBtn);
    const embed = KikiEmbed.purple('🎫 Support & Ticket Center',
      'Agar aapko server me koi help chahiye ya staff se baat karni hai, toh niche diye gaye **Open Ticket** button par click karein!\n\nEk private channel open ho jayega jahan sirf aap aur server staff honge.'
    );
    await interaction.reply({ embeds: [embed], components: [row] });
  },
  name: 'ticketsetup', aliases: ['ticket-panel'],
  async run(message) {
    const openBtn = new ButtonBuilder().setCustomId('open_ticket_btn').setLabel('Open Ticket').setStyle(ButtonStyle.Primary).setEmoji('📩');
    const row = new ActionRowBuilder().addComponents(openBtn);
    const embed = KikiEmbed.purple('🎫 Support & Ticket Center', 'Click **Open Ticket** to talk to staff.');
    message.channel.send({ embeds: [embed], components: [row] });
  }
};
'@

Write-CmdFile "admin/setlog.js" @'
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
function getCfg() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8')); }
function saveCfg(d) { fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('setlog').setDescription('📜 Set moderation and audit log channel')
    .addChannelOption(o => o.setName('channel').setDescription('Log channel').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const ch = interaction.options.getChannel('channel');
    const cfg = getCfg();
    cfg.log_channel_id = ch.id;
    saveCfg(cfg);
    await interaction.reply({ embeds: [KikiEmbed.success('Log Channel Configured', `✅ Audit logs will be delivered to ${ch.toString()}`)] });
  },
  name: 'setlog', aliases: ['modlog-set'],
  async run(message) {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply('Channel mention karo!');
    const cfg = getCfg();
    cfg.log_channel_id = ch.id;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Log Channel', `Set to ${ch.toString()}`)] });
  }
};
'@

Write-CmdFile "admin/prefix.js" @'
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config.js');
function getCfg() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/config.json'), 'utf-8')); }
function saveCfg(d) { fs.writeFileSync(path.join(__dirname, '../../data/config.json'), JSON.stringify(d, null, 2)); }

module.exports = {
  data: new SlashCommandBuilder().setName('prefix').setDescription('⚙️ Change server command prefix')
    .addStringOption(o => o.setName('new_prefix').setDescription('New prefix string'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const p = interaction.options.getString('new_prefix');
    const cfg = getCfg();
    if (!p) {
      return interaction.reply({ embeds: [KikiEmbed.purple('Current Prefix', `Prefix for this server is: \`${cfg.prefix || config.PREFIX}\``)] });
    }
    cfg.prefix = p;
    config.PREFIX = p;
    saveCfg(cfg);
    await interaction.reply({ embeds: [KikiEmbed.success('Prefix Updated', `Server prefix set to: \`${p}\``)] });
  },
  name: 'prefix', aliases: ['setprefix'],
  async run(message, args) {
    const p = args[0];
    const cfg = getCfg();
    if (!p) return message.reply({ embeds: [KikiEmbed.purple('Prefix', `Current: \`${cfg.prefix || config.PREFIX}\``)] });
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
    cfg.prefix = p;
    config.PREFIX = p;
    saveCfg(cfg);
    message.reply({ embeds: [KikiEmbed.success('Prefix Updated', `New prefix: \`${p}\``)] });
  }
};
'@

# 2. FUN COMMANDS
Write-CmdFile "fun/kikiquote.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
module.exports = {
  data: new SlashCommandBuilder().setName('kikiquote').setDescription('🔮 Receive an arcane quote from KIKI'),
  async execute(interaction) {
    await interaction.reply({ embeds: [KikiEmbed.purple('「 KIKI 」• Arcane Whispers', KIKI.randomQuote())] });
  },
  name: 'kikiquote', aliases: ['kquote', 'quote'],
  async run(message) {
    message.reply({ embeds: [KikiEmbed.purple('KIKI Quote', KIKI.randomQuote())] });
  }
};
'@

Write-CmdFile "fun/tarot.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

const cards = [
  { name: 'The Void (0)', meaning: 'Infinite potential, step boldly into the shadows.' },
  { name: 'The Magician (I)', meaning: 'Mastery over the arcane elements, manifestation.' },
  { name: 'The High Priestess (II)', meaning: 'Intuition, hidden knowledge, gothic mysteries.' },
  { name: 'The Empress (III)', meaning: 'Dark abundance, velvet roses, creative power.' },
  { name: 'Death (XIII)', meaning: 'Transformation, old endings making way for rebirth.' },
  { name: 'The Moon (XVIII)', meaning: 'Illusions, nocturnal visions, unseen forces.' },
  { name: 'The Star (XVII)', meaning: 'Hope gleaming through the deepest violet night.' }
];

module.exports = {
  data: new SlashCommandBuilder().setName('tarot').setDescription('🔮 Draw a gothic arcane tarot card'),
  async execute(interaction) {
    const card = cards[Math.floor(Math.random() * cards.length)];
    const embed = KikiEmbed.purple(`🔮 Tarot Card: ${card.name}`, `*${card.meaning}*`);
    await interaction.reply({ embeds: [embed] });
  },
  name: 'tarot', aliases: ['tarotcard'],
  async run(message) {
    const card = cards[Math.floor(Math.random() * cards.length)];
    message.reply({ embeds: [KikiEmbed.purple(`🔮 ${card.name}`, card.meaning)] });
  }
};
'@

Write-CmdFile "fun/8ball.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

const responses = [
  '🔮 It is decidedly so.',
  '💜 Without a doubt in the shadows.',
  '✨ Yes – definitely.',
  '🌙 Signs point to yes.',
  '🕷️ Reply hazy, consult the abyss again.',
  '🦇 Ask again under the moonlight.',
  '❌ Better not tell you now.',
  '💀 My dark sources say no.',
  '🖤 Very doubtful.'
];

module.exports = {
  data: new SlashCommandBuilder().setName('8ball').setDescription('🔮 Ask the dark crystal ball a question')
    .addStringOption(o => o.setName('question').setDescription('Your question').setRequired(true)),
  async execute(interaction) {
    const q = interaction.options.getString('question');
    const answer = responses[Math.floor(Math.random() * responses.length)];
    const embed = KikiEmbed.purple('🔮 Mystic 8-Ball', `**Question:** ${q}\n**Answer:** ${answer}`);
    await interaction.reply({ embeds: [embed] });
  },
  name: '8ball', aliases: ['eightball'],
  async run(message, args) {
    const q = args.join(' ');
    if (!q) return message.reply('Sawaal toh pucho!');
    const answer = responses[Math.floor(Math.random() * responses.length)];
    message.reply({ embeds: [KikiEmbed.purple('🔮 8-Ball', `**Q:** ${q}\n**A:** ${answer}`)] });
  }
};
'@

Write-CmdFile "fun/coinflip.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('coinflip').setDescription('🪙 Flip a gothic coin'),
  async execute(interaction) {
    const side = Math.random() > 0.5 ? 'Heads (The Crown) 👑' : 'Tails (The Skull) 💀';
    await interaction.reply({ embeds: [KikiEmbed.purple('🪙 Coin Flip', `The coin landed on: **${side}**`)] });
  },
  name: 'coinflip', aliases: ['flip', 'cf'],
  async run(message) {
    const side = Math.random() > 0.5 ? 'Heads 👑' : 'Tails 💀';
    message.reply({ embeds: [KikiEmbed.purple('🪙 Coin Flip', `**${side}**`)] });
  }
};
'@

Write-CmdFile "fun/roll.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('roll').setDescription('🎲 Roll a die')
    .addIntegerOption(o => o.setName('sides').setDescription('Die sides (default 6)')),
  async execute(interaction) {
    const sides = interaction.options.getInteger('sides') || 6;
    const res = Math.floor(Math.random() * sides) + 1;
    await interaction.reply({ embeds: [KikiEmbed.purple('🎲 Dice Roll', `You rolled a **${res}** (d${sides})`)] });
  },
  name: 'roll', aliases: ['dice'],
  async run(message, args) {
    const sides = parseInt(args[0]) || 6;
    const res = Math.floor(Math.random() * sides) + 1;
    message.reply({ embeds: [KikiEmbed.purple('🎲 Roll', `Result: **${res}** (d${sides})`)] });
  }
};
'@

Write-CmdFile "fun/rps.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('rps').setDescription('✂️ Play Rock Paper Scissors against KIKI')
    .addStringOption(o => o.setName('choice').setDescription('Rock, Paper, or Scissors').setRequired(true).addChoices(
      { name: 'Rock 🪨', value: 'rock' },
      { name: 'Paper 📄', value: 'paper' },
      { name: 'Scissors ✂️', value: 'scissors' }
    )),
  async execute(interaction) {
    const user = interaction.options.getString('choice');
    const choices = ['rock', 'paper', 'scissors'];
    const bot = choices[Math.floor(Math.random() * 3)];
    let res;
    if (user === bot) res = "It's a Tie! 🤝";
    else if ((user === 'rock' && bot === 'scissors') || (user === 'paper' && bot === 'rock') || (user === 'scissors' && bot === 'paper')) {
      res = 'You Win! 🎉';
    } else res = 'KIKI Wins! 🔮';
    await interaction.reply({ embeds: [KikiEmbed.purple('✂️ Rock Paper Scissors', `You: **${user}** | KIKI: **${bot}**\n\n**${res}**`)] });
  },
  name: 'rps', aliases: [],
  async run(message, args) {
    const user = args[0]?.toLowerCase();
    if (!['rock', 'paper', 'scissors'].includes(user)) return message.reply('Choose: rock, paper, or scissors');
    const bot = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
    message.reply({ embeds: [KikiEmbed.purple('RPS', `You: ${user} | KIKI: ${bot}`)] });
  }
};
'@

Write-CmdFile "fun/roast.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

const roasts = [
  'You are proof that evolution can go in reverse.',
  'Your secrets are always safe with me. I never even listen when you speak.',
  'I would explain it to you, but I do not have enough crayons.',
  'You bring everyone so much joy... whenever you leave the voice channel.',
  'If silence is golden, you are completely bankrupt.'
];

module.exports = {
  data: new SlashCommandBuilder().setName('roast').setDescription('🔥 Deliver a playful gothic roast')
    .addUserOption(o => o.setName('user').setDescription('Target user')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    await interaction.reply({ embeds: [KikiEmbed.purple('🔥 Gothic Roast', `${user.toString()}, ${roast}`)] });
  },
  name: 'roast', aliases: [],
  async run(message) {
    const user = message.mentions.users.first() || message.author;
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    message.reply({ embeds: [KikiEmbed.purple('🔥 Roast', `${user.username}, ${roast}`)] });
  }
};
'@

Write-CmdFile "fun/ship.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('ship').setDescription('💜 Calculate dark romance compatibility')
    .addUserOption(o => o.setName('user1').setDescription('First user').setRequired(true))
    .addUserOption(o => o.setName('user2').setDescription('Second user')),
  async execute(interaction) {
    const u1 = interaction.options.getUser('user1');
    const u2 = interaction.options.getUser('user2') || interaction.user;
    const percent = Math.floor(Math.random() * 101);
    let desc = `💖 **${percent}%** Compatibility in the Gothic Realm!\n`;
    if (percent > 80) desc += '🔮 A match forged in arcane velvet eternity!';
    else if (percent > 50) desc += '💜 There is dark chemistry here.';
    else desc += '🥀 The shadows say: just friends.';
    await interaction.reply({ embeds: [KikiEmbed.purple(`Ship: ${u1.username} & ${u2.username}`, desc)] });
  },
  name: 'ship', aliases: ['love'],
  async run(message) {
    const users = message.mentions.users;
    if (users.size < 1) return message.reply('Do users mention karo!');
    const percent = Math.floor(Math.random() * 101);
    message.reply({ embeds: [KikiEmbed.purple('Ship Calculator', `Compatibility: **${percent}%**`)] });
  }
};
'@

# 3. UTILITY COMMANDS
Write-CmdFile "utility/uptime.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
module.exports = {
  data: new SlashCommandBuilder().setName('uptime').setDescription('⏱️ View KIKI uptime'),
  async execute(interaction, client) {
    const uptimeStr = KIKI.formatDuration(client.uptime);
    await interaction.reply({ embeds: [KikiEmbed.purple('⏱️ KIKI Uptime', `Active in the void for: **${uptimeStr}**`)] });
  },
  name: 'uptime', aliases: ['up'],
  async run(message, args, client) {
    message.reply({ embeds: [KikiEmbed.purple('Uptime', `Online for: ${KIKI.formatDuration(client.uptime)}`)] });
  }
};
'@

Write-CmdFile "utility/membercount.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('membercount').setDescription('👥 Server member statistics'),
  async execute(interaction) {
    await interaction.guild.members.fetch();
    const total = interaction.guild.memberCount;
    const humans = interaction.guild.members.cache.filter(m => !m.user.bot).size;
    const bots = interaction.guild.members.cache.filter(m => m.user.bot).size;
    const embed = KikiEmbed.purple('👥 Member Count Breakdown',
      `• **Total:** ${total}\n• **Humans:** ${humans}\n• **Bots:** ${bots}`
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'membercount', aliases: ['mc', 'members'],
  async run(message) {
    message.reply({ embeds: [KikiEmbed.purple('Member Count', `Total: ${message.guild.memberCount}`)] });
  }
};
'@

Write-CmdFile "utility/afk.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('afk').setDescription('🌙 Set your AFK status')
    .addStringOption(o => o.setName('reason').setDescription('Reason for being AFK')),
  async execute(interaction) {
    const reason = interaction.options.getString('reason') || 'AFK in the shadows';
    await interaction.reply({ embeds: [KikiEmbed.purple('AFK Status Set 🌙', `${interaction.user.toString()} is now AFK: *${reason}*`)] });
  },
  name: 'afk', aliases: [],
  async run(message, args) {
    const reason = args.join(' ') || 'AFK';
    message.reply({ embeds: [KikiEmbed.purple('AFK', `${message.author.username} is now AFK: ${reason}`)] });
  }
};
'@

Write-CmdFile "utility/poll.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('poll').setDescription('📊 Create an interactive reaction poll')
    .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true)),
  async execute(interaction) {
    const q = interaction.options.getString('question');
    const embed = KikiEmbed.purple('📊 Community Poll', `**${q}**\n\nVote using the reactions below!`)
      .setFooter({ text: `Poll started by ${interaction.user.tag}` });
    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await msg.react('👍');
    await msg.react('👎');
  },
  name: 'poll', aliases: [],
  async run(message, args) {
    const q = args.join(' ');
    if (!q) return message.reply('Poll question likho!');
    const msg = await message.channel.send({ embeds: [KikiEmbed.purple('📊 Poll', q)] });
    await msg.react('👍');
    await msg.react('👎');
  }
};
'@

Write-CmdFile "utility/banner.js" @'
const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('banner').setDescription('🖼️ View user or server banner')
    .addUserOption(o => o.setName('user').setDescription('Target user')),
  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;
    const fetched = await client.users.fetch(user.id, { force: true });
    if (!fetched.banner) {
      return interaction.reply({ embeds: [KikiEmbed.info('No Banner', `${user.username} ke paas custom banner nahi hai.`)], ephemeral: true });
    }
    const url = fetched.bannerURL({ size: 1024, dynamic: true });
    const embed = KikiEmbed.purple(`${user.username}'s Banner`, `[Open Link](${url})`).setImage(url);
    await interaction.reply({ embeds: [embed] });
  },
  name: 'banner', aliases: ['ubanner'],
  async run(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    const fetched = await client.users.fetch(user.id, { force: true });
    if (!fetched.banner) return message.reply('No banner found.');
    message.reply({ embeds: [KikiEmbed.purple(`${user.username}'s Banner`).setImage(fetched.bannerURL({ size: 1024 }))] });
  }
};
'@

Write-Host "Batch 2 successfully created!"
