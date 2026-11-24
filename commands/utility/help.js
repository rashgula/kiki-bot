const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const config = require('../../config.js');
const fs = require('fs');
const path = require('path');
const KIKI = require('../../utils/kiki.js');

// Category metadata and permission tiers
const CATEGORY_META = {
  games: {
    name: 'Interactive Games',
    emoji: '🎮',
    desc: 'Blackjack, roulette, duel RPG, connect4, trivia, ttt, guess, hangman',
    tier: 'regular'
  },
  economy: {
    name: 'Gothic Economy',
    emoji: '🪙',
    desc: 'Coins wallet, bank vault, daily reward, work shift, crime heist, shop',
    tier: 'regular'
  },
  fun: {
    name: 'Gothic Arts & Fun',
    emoji: '🎭',
    desc: 'Cute animals, memes, roasts, 8ball, coinflip, dice, anime actions',
    tier: 'regular'
  },
  social: {
    name: 'Social & Union',
    emoji: '👥',
    desc: 'Marriage covenants, divorce, love ship rating, gothic profiles',
    tier: 'regular'
  },
  utility: {
    name: 'Utility & Tools',
    emoji: '📊',
    desc: 'Serverinfo, userinfo, avatar, banner, latency ping, bot specs',
    tier: 'regular'
  },
  moderation: {
    name: 'Moderation & Controls',
    emoji: '🔨',
    desc: 'Ban, kick, timeout, purge messages, lock, slowmode, nick controls',
    tier: 'staff'
  },
  admin: {
    name: 'Server Setup & Admin',
    emoji: '⚙️',
    desc: 'Tickets, voicemaster, welcome, autorole, logs, prefix, backups',
    tier: 'staff'
  },
  security: {
    name: 'Security & Shields',
    emoji: '🚨',
    desc: 'Raid scanners, permission audits, anti-alt sweeps, security logs',
    tier: 'staff'
  },
  antinuke: {
    name: 'Anti-Nuke Fortress',
    emoji: '🛡️',
    desc: 'KIKI master anti-nuke, whitelist, auto-restore & raid shields',
    tier: 'owner'
  },
  nuke: {
    name: 'Server Cleanup & Reset',
    emoji: '💥',
    desc: 'Channel clones, mass cleanups, unban-all, purge-bots',
    tier: 'owner'
  }
};

// Top 1-click runnable commands by category
const RUNNABLE_COMMANDS = {
  home: [
    { name: 'balance', label: '💰 Check Balance', desc: 'Inspect your wallet & bank coins' },
    { name: 'daily', label: '🎁 Claim Daily', desc: 'Claim daily gothic coins bonus' },
    { name: 'work', label: '💼 Work Shift', desc: 'Work a shift in the catacombs' },
    { name: 'cat', label: '🐱 Random Cat', desc: 'Send cute gothic cat photo' },
    { name: 'dog', label: '🐶 Loyal Dog', desc: 'Send loyal dog companion photo' },
    { name: 'meme', label: '🎭 Gothic Meme', desc: 'Fetch a curated gothic meme' },
    { name: 'joke', label: '🃏 Joke Box', desc: 'Tell a gothic/developer joke' },
    { name: 'roast', label: '🔥 Gothic Roast', desc: 'Deliver a savage dark roast' },
    { name: 'blackjack', label: '🃏 21 Blackjack', desc: 'Play 21 card blackjack vs dealer' },
    { name: 'roulette', label: '🎰 Roulette Wheel', desc: 'Bet on red or black on roulette' },
    { name: 'mines', label: '💣 Minesweeper', desc: 'Play spoiler minesweeper grid' },
    { name: 'duel', label: '⚔️ RPG Duel', desc: 'Turn-based mock combat battle' },
    { name: 'riddle', label: '🧩 Riddle Puzzle', desc: 'Solve clever brain teaser' },
    { name: 'ping', label: '🏓 Bot Ping', desc: 'Check bot latency and ping' },
    { name: 'avatar', label: '🖼️ View Avatar', desc: 'Inspect your profile avatar' },
    { name: 'serverinfo', label: '🏰 Server Info', desc: 'Inspect guild information' }
  ],
  games: [
    { name: 'blackjack', label: '🃏 21 Blackjack', desc: 'Play 21 card blackjack vs dealer' },
    { name: 'coinwager', label: '🪙 Coin Wager', desc: 'Bet coins on 50/50 coinflip toss' },
    { name: 'connect4', label: '🔴 Connect 4', desc: 'Play 4-in-a-row checkers game' },
    { name: 'duel', label: '⚔️ RPG Duel', desc: 'Turn-based mock combat battle' },
    { name: 'type', label: '⌨️ Fast Typer', desc: 'Fast typing speed race' },
    { name: 'flag', label: '🚩 Flag Quiz', desc: 'Guess country flag trivia' },
    { name: 'guess', label: '🎯 Guess The Number', desc: 'Guess secret number (1-100)' },
    { name: 'hangman', label: '🎮 Hangman Puzzle', desc: 'Gothic word letter guessing' },
    { name: 'logo', label: '🏢 Logo Quiz', desc: 'Identify brand from clues' },
    { name: 'mines', label: '💣 Minesweeper', desc: 'Interactive spoiler minesweeper' },
    { name: 'riddle', label: '🧩 Riddle Puzzle', desc: 'Solve clever brain teaser' },
    { name: 'roulette', label: '🎰 Roulette Wheel', desc: 'Spin roulette on red or black' },
    { name: 'rr', label: '🔫 Russian Roulette', desc: 'Spin cylinder party luck game' },
    { name: 'spin', label: '🎰 3-Reel Slots', desc: 'Gothic slot machine jackpot' },
    { name: 'ttt', label: '❌ Tic-Tac-Toe', desc: 'Play 3x3 tic tac toe game' },
    { name: 'animetrivia', label: '⛩️ Anime Trivia', desc: 'Anime lore multiple choice' },
    { name: 'gamingtrivia', label: '🎮 Gaming Trivia', desc: 'Video games lore quiz' },
    { name: 'generaltrivia', label: '🧠 General Trivia', desc: 'General knowledge quiz' },
    { name: 'mathspeed', label: '⚡ Speed Math', desc: 'Rapid arithmetic calculation' },
    { name: 'scramble', label: '🔤 Word Scramble', desc: 'Unscramble mixed letters' }
  ],
  economy: [
    { name: 'balance', label: '💰 Check Balance', desc: 'Inspect wallet and bank vault' },
    { name: 'daily', label: '🎁 Claim Daily', desc: 'Claim daily gothic coins bonus' },
    { name: 'work', label: '💼 Work Shift', desc: 'Work a gothic underground shift' },
    { name: 'crime', label: '🗡️ Heist Attempt', desc: 'Dark heist attempt in shadows' },
    { name: 'fish', label: '🎣 Lake Fishing', desc: 'Cast line in obsidian lake' },
    { name: 'hunt', label: '🏹 Woods Hunting', desc: 'Hunt shadow beasts in woods' },
    { name: 'bet', label: '🎲 Dice Bet', desc: 'Bet coins on dice roll vs KIKI' },
    { name: 'slots', label: '🎰 Gothic Slots', desc: 'Spin gothic slot machine' },
    { name: 'shop', label: '🛒 Browse Shop', desc: 'View artifact shop items' },
    { name: 'inv', label: '🎒 Bag Inventory', desc: 'View items in your bag' },
    { name: 'rich', label: '🏆 Rich Leaderboard', desc: 'View richest members top' }
  ],
  fun: [
    { name: 'cat', label: '🐱 Cat Photo', desc: 'Send cute gothic cat photo' },
    { name: 'dog', label: '🐶 Dog Photo', desc: 'Send loyal dog friend photo' },
    { name: 'bird', label: '🦅 Bird Photo', desc: 'Send night raven or bird photo' },
    { name: 'fox', label: '🦊 Fox Photo', desc: 'Send wild red fox photo' },
    { name: 'panda', label: '🐼 Panda Photo', desc: 'Send cute fluffy panda photo' },
    { name: 'meme', label: '🎭 Gothic Meme', desc: 'Fetch a fresh gothic meme' },
    { name: 'joke', label: '🃏 Joke Box', desc: 'Tell a gothic/programmer joke' },
    { name: 'roast', label: '🔥 Gothic Roast', desc: 'Deliver a savage dark roast' },
    { name: 'fact', label: '💡 Real Fact', desc: 'Interesting real factual trivia' },
    { name: 'flip', label: '🪙 Silver Coin', desc: 'Toss a gothic silver coin' },
    { name: 'dice', label: '🎲 Dice Roll', desc: 'Roll a 6-sided polyhedral die' },
    { name: 'rps', label: '✂️ RPS vs Bot', desc: 'Play Rock Paper Scissors' },
    { name: '8ball', label: '🎱 Mystic 8ball', desc: 'Consult dark mystic 8ball' },
    { name: 'hug', label: '🤗 Gothic Hug', desc: 'Give a warm gothic hug' },
    { name: 'kiss', label: '💋 Gothic Kiss', desc: 'Give a sweet gothic kiss' },
    { name: 'slap', label: '👋 Shadow Slap', desc: 'Deliver a swift shadow slap' },
    { name: 'ship', label: '🖤 Romance Ship', desc: 'Calculate dark love compatibility' }
  ],
  social: [
    { name: 'marriage', label: '💍 Marriage Status', desc: 'View current gothic union' },
    { name: 'ship', label: '🖤 Love Compatibility', desc: 'Check dark romance rating' },
    { name: 'divorce', label: '💔 Divorce Union', desc: 'Dissolve gothic union covenant' }
  ],
  utility: [
    { name: 'ping', label: '🏓 Bot Ping', desc: 'Check latency & websocket ping' },
    { name: 'avatar', label: '🖼️ View Avatar', desc: 'Inspect your profile avatar' },
    { name: 'banner', label: '🎨 View Banner', desc: 'Inspect your profile banner' },
    { name: 'userinfo', label: '👤 User Info', desc: 'Inspect user profile details' },
    { name: 'serverinfo', label: '🏰 Server Info', desc: 'Inspect guild information' },
    { name: 'botinfo', label: '🤖 Bot Info', desc: 'Inspect KIKI bot specifications' }
  ],
  moderation: [
    { name: 'purge', label: '🧹 Purge Messages', desc: 'Clear recent chat messages' },
    { name: 'lock', label: '🔒 Lock Channel', desc: 'Lock current channel permissions' },
    { name: 'unlock', label: '🔓 Unlock Channel', desc: 'Unlock channel permissions' },
    { name: 'slowmode', label: '⏱️ Set Slowmode', desc: 'Adjust channel slowmode' }
  ],
  admin: [
    { name: 'setuplogs', label: '📋 Setup Logs', desc: 'Auto-create 5 log channels' },
    { name: 'setuplevelroles', label: '🏆 Setup Level Roles', desc: 'Auto-create 10 level roles' },
    { name: 'autorole', label: '🎭 Setup Autoroles', desc: 'Auto-assign join roles' }
  ],
  security: [
    { name: 'security', label: '🚨 Security Scanner', desc: 'Run server permission audit' }
  ],
  antinuke: [
    { name: 'master-antinuke', label: '🛡️ Master Anti-Nuke', desc: 'Open Master Anti-Nuke Panel' },
    { name: 'whitelist', label: '📋 Whitelist Status', desc: 'Inspect whitelisted members' }
  ],
  nuke: [
    { name: 'clone', label: '💥 Clone Channel', desc: 'Clone and wipe channel' }
  ]
};

// Determine user access tier
function getUserLevel(guild, member, userId, client) {
  if (!userId) return 'regular';
  if (KIKI.isServerOrBotOwner(guild, userId)) return 'owner';
  if (KIKI.isSafe(guild, userId, client)) return 'staff';
  if (member?.permissions?.has?.('Administrator') ||
      member?.permissions?.has?.(['ManageGuild', 'BanMembers', 'KickMembers', 'ManageMessages', 'ManageRoles', 'ManageChannels'], false)) {
    return 'staff';
  }
  return 'regular';
}

// Get categories allowed for this user's level
function getAllowedCategories(userLevel) {
  if (userLevel === 'owner') {
    return ['games', 'economy', 'fun', 'social', 'utility', 'moderation', 'admin', 'security', 'antinuke', 'nuke'];
  }
  if (userLevel === 'staff') {
    return ['games', 'economy', 'fun', 'social', 'utility', 'moderation', 'admin', 'security'];
  }
  return ['games', 'economy', 'fun', 'social', 'utility'];
}

function getCategoryCommands(category) {
  const catPath = path.join(__dirname, '..', category);
  if (!fs.existsSync(catPath)) return [];
  return fs.readdirSync(catPath)
    .filter(f => f.endsWith('.js'))
    .map(f => f.replace('.js', ''));
}

// Build Main Menu Embed customized to user's permissions
function buildMainMenuEmbed(userLevel, totalCmds, prefix = '&') {
  const allowed = getAllowedCategories(userLevel);

  let badge = '👤 Member Mode (Public Commands)';
  let footerNote = '🔒 Staff & Anti-Nuke commands hidden (Whitelist / Staff permission required)';

  if (userLevel === 'owner') {
    badge = '👑 Server / Bot Owner Mode (All 1,140+ Commands Unlocked)';
    footerNote = '👑 Server Owner: Full Master Anti-Nuke Fortress & Server Defense unlocked';
  } else if (userLevel === 'staff') {
    badge = '🛡️ Staff & Whitelisted Mode (Staff Commands Unlocked)';
    footerNote = '🛡️ Staff Access: Moderation, Admin & Security unlocked (Anti-Nuke reserved for Owner)';
  }

  const embed = KikiEmbed.purple(
    `🔮 「 KIKI 」• Command Center (${badge})`,
    `**Gothic Discord Engine v${config.BOT_VERSION} | 1-Click Interactive Help Center**\n\n` +
    `⚡ **Kissi bhi command ko chalane ke liye type karne ki zaroorat nahi hai!**\n` +
    `Neeche diye **"⚡ Click To Run Command"** dropdown menu ya **Quick Buttons** par click karein aur command turant execute ho jayegi!\n\n` +
    `• **Prefix:** \`${prefix}\` | **Slash:** \`/<cmd>\`\n` +
    `• **Your Access Level:** **${badge}**\n` +
    `• **Available Modules:** **${allowed.length} Categories**`
  );

  allowed.forEach(cat => {
    const meta = CATEGORY_META[cat];
    const cmds = getCategoryCommands(cat);
    embed.addFields({
      name: `${meta.emoji} ${meta.name} (${cmds.length} cmds)`,
      value: `\`${prefix}help ${cat}\`\n*${meta.desc}*`,
      inline: true
    });
  });

  embed.setFooter({ text: footerNote });
  return embed;
}

// Build Category Embed
function buildCategoryEmbed(category, userLevel, prefix = '&') {
  const meta = CATEGORY_META[category] || { name: category.toUpperCase(), emoji: '🔮', desc: 'Category commands' };
  const cmds = getCategoryCommands(category);

  const embed = KikiEmbed.purple(
    `${meta.emoji} ${meta.name} — [${cmds.length} Commands]`,
    `*${meta.desc}*\n\n` +
    `⚡ **1-Click Execution:** Neeche dropdown menu se kisi bhi command par click karein aur wo turant run ho jayegi!\n` +
    `💬 *Ya type karein: \`${prefix}<cmd>\` ya \`/<cmd>\`*\n` +
    `• Total Commands: **${cmds.length}**`
  );

  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const cmd of cmds) {
    const item = `\`${cmd}\``;
    if (currentLength + item.length + 2 > 900) {
      chunks.push(currentChunk.join(', '));
      currentChunk = [item];
      currentLength = item.length;
    } else {
      currentChunk.push(item);
      currentLength += item.length + 2;
    }
  }
  if (currentChunk.length) chunks.push(currentChunk.join(', '));

  chunks.forEach((chunk, index) => {
    const fieldTitle = chunks.length === 1
      ? `📜 Commands List (${cmds.length})`
      : `📜 Commands List (Part ${index + 1}/${chunks.length})`;
    embed.addFields({ name: fieldTitle, value: chunk, inline: false });
  });

  return embed;
}

// Build Category Navigation Dropdown (Filtered by user permission level)
function buildCategorySelectMenu(userLevel, currentCat = 'home') {
  const allowed = getAllowedCategories(userLevel);
  const options = [
    { label: 'Main Menu / Overview', description: 'Return to main help portal', value: 'cat_home', emoji: '🏠' }
  ];

  allowed.forEach(cat => {
    const meta = CATEGORY_META[cat];
    const cmds = getCategoryCommands(cat);
    options.push({
      label: `${meta.name} (${cmds.length})`,
      description: meta.desc.substring(0, 50),
      value: `cat_${cat}`,
      emoji: meta.emoji,
      default: cat === currentCat
    });
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId('help_category')
    .setPlaceholder('🔮 Select Category to Explore...')
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
}

// Build 1-Click Instant Run Dropdown
function buildInstantRunSelectMenu(category = 'home') {
  const list = RUNNABLE_COMMANDS[category] || RUNNABLE_COMMANDS.home;
  const options = list.slice(0, 25).map(cmd => ({
    label: cmd.label,
    description: cmd.desc.substring(0, 50),
    value: `run_${cmd.name}`,
    emoji: '⚡'
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId('help_run_cmd')
    .setPlaceholder('⚡ Click any command here to run it instantly without typing...')
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
}

// Build 1-Click Quick Action Buttons Row
function buildQuickActionButtons() {
  const b1 = new ButtonBuilder().setCustomId('run_cmd_balance').setLabel('Balance').setStyle(ButtonStyle.Success).setEmoji('💰');
  const b2 = new ButtonBuilder().setCustomId('run_cmd_daily').setLabel('Daily').setStyle(ButtonStyle.Primary).setEmoji('🎁');
  const b3 = new ButtonBuilder().setCustomId('run_cmd_work').setLabel('Work').setStyle(ButtonStyle.Secondary).setEmoji('💼');
  const b4 = new ButtonBuilder().setCustomId('run_cmd_cat').setLabel('Cat').setStyle(ButtonStyle.Secondary).setEmoji('🐱');
  const b5 = new ButtonBuilder().setCustomId('run_cmd_blackjack').setLabel('Blackjack 21').setStyle(ButtonStyle.Danger).setEmoji('🃏');

  return new ActionRowBuilder().addComponents(b1, b2, b3, b4, b5);
}

// Build Invite Row
function buildInviteRow(clientId) {
  const inviteUrl = KIKI.getBotInviteUrl(clientId);
  const inviteBtn = new ButtonBuilder()
    .setLabel('➕ Add KIKI to Server')
    .setStyle(ButtonStyle.Link)
    .setURL(inviteUrl);
  return new ActionRowBuilder().addComponents(inviteBtn);
}

// ── DIRECT 1-CLICK COMMAND EXECUTOR ──────────────────────────────
async function executeDirectCommand(interaction, cmdName, client) {
  const command = client.prefixCommands?.get(cmdName) || client.commands?.get(cmdName);
  if (!command) {
    return interaction.reply({
      content: `⚠️ Command \`${cmdName}\` not found in bot registry!`,
      ephemeral: true
    });
  }

  const cat = (command.category || '').toLowerCase();
  const isAntiNukeCmd = cat === 'antinuke' || cat === 'nuke' ||
    cmdName === 'antinuke' || cmdName === 'master-antinuke' || cmdName === 'whitelist' || cmdName.startsWith('anti-');

  // Strict ownership check
  if (isAntiNukeCmd && !KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id)) {
    return interaction.reply({
      embeds: [KikiEmbed.error('Ownership Required 👑', `⚠️ Anti-Nuke security commands sirf **Server Owner** ya **Bot Owner** ke liye reserved hain!`)],
      ephemeral: true
    });
  }

  // Staff check
  const isProtectedCategory = ['admin', 'moderation', 'security'].includes(cat);
  if (isProtectedCategory) {
    const isOwner = KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id);
    const isSafe = KIKI.isSafe(interaction.guild, interaction.user.id, client);
    const hasStaffPerms = interaction.member?.permissions?.has?.('Administrator') ||
      interaction.member?.permissions?.has?.(['ManageGuild', 'BanMembers', 'KickMembers', 'ManageMessages', 'ManageRoles', 'ManageChannels'], false);

    if (!isOwner && !isSafe && !hasStaffPerms) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Staff Permission Required 🛡️', `⚠️ Ye command chalane ke liye aapke paas **Staff Permissions** ya **Whitelist** hona zaroori hai!`)],
        ephemeral: true
      });
    }
  }

  // Acknowledge interaction directly with deferred reply
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: false });
  }

  try {
    const { Collection } = require('discord.js');
    let repliedOrEdited = false;

    // Full Collection instances for all mention types
    const mentionsUsers = new Collection();
    const mentionsMembers = new Collection();
    const mentionsChannels = new Collection();
    const mentionsRoles = new Collection();

    const fakeMsg = {
      id: interaction.id,
      guild: interaction.guild,
      guildId: interaction.guildId,
      channel: interaction.channel,
      channelId: interaction.channelId,
      author: interaction.user,
      user: interaction.user,
      member: interaction.member,
      client: client,
      content: `&${cmdName}`,
      createdTimestamp: Date.now(),
      createdAt: new Date(),
      mentions: {
        users: mentionsUsers,
        members: mentionsMembers,
        channels: mentionsChannels,
        roles: mentionsRoles,
        crosspostedChannels: new Collection(),
        everyone: false,
        has: () => false,
        first: () => null
      },
      attachments: new Collection(),
      embeds: [],
      components: [],
      reactions: { cache: new Collection() },
      reference: null,
      pinned: false,
      tts: false,
      nonce: null,
      system: false,
      flags: { bitfield: 0, has: () => false },
      reply: async (payload) => {
        let msgPayload = typeof payload === 'string' ? { content: payload } : payload;
        try {
          if (!repliedOrEdited) {
            repliedOrEdited = true;
            if (interaction.deferred) {
              return await interaction.editReply(msgPayload);
            } else if (!interaction.replied) {
              return await interaction.reply(msgPayload);
            }
          }
          return await interaction.followUp(msgPayload);
        } catch (err) {
          return await interaction.channel?.send?.(msgPayload).catch(() => null);
        }
      },
      react: async () => {},
      delete: async () => {}
    };

    if (typeof command.run === 'function') {
      await command.run(fakeMsg, [], client);
    } else if (typeof command.execute === 'function') {
      const safeInteraction = new Proxy(interaction, {
        get(target, prop) {
          if (prop === 'reply') {
            return async (payload) => {
              repliedOrEdited = true;
              if (target.deferred || target.replied) {
                return await target.editReply(payload);
              }
              return await target.reply(payload);
            };
          }
          if (prop === 'deferReply') {
            return async () => {};
          }
          return target[prop];
        }
      });
      await command.execute(safeInteraction, client);
    }

    if (!repliedOrEdited && interaction.deferred) {
      await interaction.editReply({
        embeds: [KikiEmbed.success('Command Executed ⚡', `Command **&${cmdName}** successfully run ho chuki hai!`)]
      }).catch(() => null);
    }
  } catch (err) {
    console.error(`[1-CLICK CMD ERROR] ${cmdName}:`, err);
    const errEmbed = KikiEmbed.error('Execution Error', `\`\`\`${err.message}\`\`\``);
    await interaction.editReply({ embeds: [errEmbed] }).catch(() => null);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('🔮 View KIKI Gothic 1-Click Interactive Help Center')
    .addStringOption(o =>
      o.setName('category')
        .setDescription('Specific category to inspect')
    ),

  async execute(interaction, client) {
    const userLevel = getUserLevel(interaction.guild, interaction.member, interaction.user.id, client);
    const cat = interaction.options.getString('category')?.toLowerCase();
    const totalCmds = client.totalCommands || 1140;

    try {
      if (cat && CATEGORY_META[cat]) {
        const allowed = getAllowedCategories(userLevel);
        if (!allowed.includes(cat)) {
          return interaction.reply({
            embeds: [KikiEmbed.error('Access Denied 🔒', `Aapke paas **${CATEGORY_META[cat].name}** category dekhne ki permission nahi hai!`)],
            ephemeral: true
          });
        }
        const embed = buildCategoryEmbed(cat, userLevel, config.PREFIX);
        const row1 = buildCategorySelectMenu(userLevel, cat);
        const row2 = buildInstantRunSelectMenu(cat);
        const row3 = buildQuickActionButtons();
        return await interaction.reply({ embeds: [embed], components: [row1, row2, row3] });
      }

      const embed = buildMainMenuEmbed(userLevel, totalCmds, config.PREFIX);
      const row1 = buildCategorySelectMenu(userLevel, 'home');
      const row2 = buildInstantRunSelectMenu('home');
      const row3 = buildQuickActionButtons();
      const row4 = buildInviteRow(client.user?.id);
      await interaction.reply({ embeds: [embed], components: [row1, row2, row3, row4] });
    } catch (err) {
      console.error('[HELP EXECUTE ERROR]', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ Help menu load karne me error aaya: ' + err.message, ephemeral: true });
      }
    }
  },

  async handleSelect(interaction, client) {
    try {
      const { customId, values } = interaction;
      const val = values[0];
      const userLevel = getUserLevel(interaction.guild, interaction.member, interaction.user.id, client);
      const totalCmds = client.totalCommands || 1140;

      // ── 1. Category Navigation Selection ──
      if (customId === 'help_category') {
        if (val === 'cat_home') {
          const embed = buildMainMenuEmbed(userLevel, totalCmds, config.PREFIX);
          const row1 = buildCategorySelectMenu(userLevel, 'home');
          const row2 = buildInstantRunSelectMenu('home');
          const row3 = buildQuickActionButtons();
          return await interaction.update({ embeds: [embed], components: [row1, row2, row3] });
        }

        const categoryKey = val.replace('cat_', '');
        if (CATEGORY_META[categoryKey]) {
          const allowed = getAllowedCategories(userLevel);
          if (!allowed.includes(categoryKey)) {
            return await interaction.reply({
              embeds: [KikiEmbed.error('Access Denied 🔒', `Aapke paas **${CATEGORY_META[categoryKey].name}** category dekhne ki permission nahi hai!`)],
              ephemeral: true
            });
          }
          const embed = buildCategoryEmbed(categoryKey, userLevel, config.PREFIX);
          const row1 = buildCategorySelectMenu(userLevel, categoryKey);
          const row2 = buildInstantRunSelectMenu(categoryKey);
          const row3 = buildQuickActionButtons();
          return await interaction.update({ embeds: [embed], components: [row1, row2, row3] });
        }
      }

      // ── 2. Instant 1-Click Command Execution ──
      if (customId === 'help_run_cmd') {
        const cmdName = val.replace('run_', '');
        return await executeDirectCommand(interaction, cmdName, client);
      }
    } catch (err) {
      console.error('[HELP SELECT ERROR]', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ Action error: ' + err.message, ephemeral: true }).catch(() => {});
      }
    }
  },

  async handleButton(interaction, client) {
    try {
      const id = interaction.customId;

      // ── 1-Click Quick Action Button Execution ──
      if (id.startsWith('run_cmd_')) {
        const cmdName = id.replace('run_cmd_', '');
        return await executeDirectCommand(interaction, cmdName, client);
      }

      if (id === 'help_btn_home') {
        const userLevel = getUserLevel(interaction.guild, interaction.member, interaction.user.id, client);
        const embed = buildMainMenuEmbed(userLevel, client.totalCommands || 1140, config.PREFIX);
        const row1 = buildCategorySelectMenu(userLevel, 'home');
        const row2 = buildInstantRunSelectMenu('home');
        const row3 = buildQuickActionButtons();
        return await interaction.update({ embeds: [embed], components: [row1, row2, row3] });
      }
    } catch (err) {
      console.error('[HELP BUTTON ERROR]', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ Button error: ' + err.message, ephemeral: true }).catch(() => {});
      }
    }
  },

  name: 'help',
  aliases: ['h', 'commands', 'cmds'],
  async run(message, args, client) {
    const userLevel = getUserLevel(message.guild, message.member, message.author.id, client);
    const totalCmds = client.totalCommands || 1140;
    const query = args[0]?.toLowerCase();
    const allowed = getAllowedCategories(userLevel);

    // Direct category query
    if (query && CATEGORY_META[query]) {
      if (!allowed.includes(query)) {
        return message.reply({
          embeds: [KikiEmbed.error('Access Denied 🔒', `Aapke paas **${CATEGORY_META[query].name}** category dekhne ki permission nahi hai!`)]
        });
      }
      const embed = buildCategoryEmbed(query, userLevel, config.PREFIX);
      const row1 = buildCategorySelectMenu(userLevel, query);
      const row2 = buildInstantRunSelectMenu(query);
      const row3 = buildQuickActionButtons();
      return message.reply({ embeds: [embed], components: [row1, row2, row3] });
    }

    // Check aliases for categories
    const aliasMap = {
      game: 'games', games: 'games', eco: 'economy', economy: 'economy',
      fun: 'fun', soc: 'social', social: 'social', util: 'utility', utility: 'utility',
      mod: 'moderation', moderation: 'moderation', admin: 'admin', sec: 'security', security: 'security',
      an: 'antinuke', antinuke: 'antinuke', nuke: 'nuke'
    };
    if (query && aliasMap[query]) {
      const targetCat = aliasMap[query];
      if (!allowed.includes(targetCat)) {
        return message.reply({
          embeds: [KikiEmbed.error('Access Denied 🔒', `Aapke paas **${CATEGORY_META[targetCat].name}** category dekhne ki permission nahi hai!`)]
        });
      }
      const embed = buildCategoryEmbed(targetCat, userLevel, config.PREFIX);
      const row1 = buildCategorySelectMenu(userLevel, targetCat);
      const row2 = buildInstantRunSelectMenu(targetCat);
      const row3 = buildQuickActionButtons();
      return message.reply({ embeds: [embed], components: [row1, row2, row3] });
    }

    // Single command query
    if (query) {
      const cmd = client.prefixCommands.get(query) || client.commands.get(query);
      if (cmd) {
        const cat = (cmd.category || '').toLowerCase();
        if (cat && !allowed.includes(cat)) {
          return message.reply({
            embeds: [KikiEmbed.error('Access Denied 🔒', `⚠️ Ye command restricted category (**${cat}**) me aati hai jiske liye aapke paas permissions nahi hain!`)]
          });
        }
        const desc = cmd.data?.description || cmd.description || 'Gothic command';
        const aliases = cmd.aliases?.length ? cmd.aliases.map(a => `\`${a}\``).join(', ') : 'None';
        const embed = KikiEmbed.purple(
          `Command Details: ${query}`,
          `**Name:** \`${query}\`\n` +
          `**Category:** \`${cat || 'General'}\`\n` +
          `**Description:** ${desc}\n` +
          `**Aliases:** ${aliases}\n` +
          `**Usage:** \`${config.PREFIX}${query}\` or \`/${query}\``
        );
        return message.reply({ embeds: [embed] });
      }
    }

    // Default Main Menu
    const embed = buildMainMenuEmbed(userLevel, totalCmds, config.PREFIX);
    const row1 = buildCategorySelectMenu(userLevel, 'home');
    const row2 = buildInstantRunSelectMenu('home');
    const row3 = buildQuickActionButtons();
    const row4 = buildInviteRow(client.user?.id);
    message.reply({ embeds: [embed], components: [row1, row2, row3, row4] });
  }
};
