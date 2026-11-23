const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const config = require('../../config.js');
const fs = require('fs');
const path = require('path');

// Category metadata
const CATEGORY_META = {
  antinuke: { name: 'Anti-Nuke & Defense', emoji: '🛡️', desc: 'KIKI anti-nuke, whitelist, auto-restore & raid shields' },
  moderation: { name: 'Moderation & Controls', emoji: '🔨', desc: 'Ban, kick, timeout, purge, warn, lock, slowmode, nick' },
  admin: { name: 'Server Setup & Admin', emoji: '⚙️', desc: 'Tickets, voicemaster, welcome, autorole, logs, prefix, backups' },
  utility: { name: 'Utility & Diagnostics', emoji: '📊', desc: 'Userinfo, serverinfo, avatar, banner, ping, botinfo, stats' },
  fun: { name: 'Gothic Arts & Fun', emoji: '🎭', desc: 'Tarot, dark quotes, crystal ball, memes, roasts, dice' },
  security: { name: 'Security & Shields', emoji: '🚨', desc: 'Raid scanners, permission audits, alt detection' },
  nuke: { name: 'Server Cleanup & Reset', emoji: '💥', desc: 'Channel clones, mass cleanups, unban-all, purge-bots' },
  economy: { name: 'Gothic Economy', emoji: '🪙', desc: 'Dark coins, daily rewards, gothic shop, bank vault' },
  games: { name: 'Interactive Games', emoji: '🎮', desc: 'Trivia, blackjack, slots, riddles, duel RPG' },
  social: { name: 'Social & Marriage', emoji: '👥', desc: 'Gothic profiles, badges, marriage unions, rep' }
};

function getCategoryCommands(category) {
  const catPath = path.join(__dirname, '..', category);
  if (!fs.existsSync(catPath)) return [];
  return fs.readdirSync(catPath)
    .filter(f => f.endsWith('.js'))
    .map(f => f.replace('.js', ''));
}

function buildMainMenuEmbed(totalCommands) {
  const p = config.PREFIX;
  const embed = KikiEmbed.purple(
    '🔮 「 KIKI 」• Gothic Command Library (1,114+ Commands)',
    `**Gothic Purple Discord Engine v${config.BOT_VERSION} | KIKI Command Library**\n\n` +
    `Select any category from the dropdown menu below or type \`${p}help <category>\` to view all commands in that module!\n\n` +
    `• **Prefix:** \`${p}\`\n` +
    `• **Slash Commands:** \`/<cmd>\`\n` +
    `• **Total Active Commands:** **${totalCommands}+** *(All commands accessible)*`
  );

  embed.addFields(
    { name: '🛡️ Anti-Nuke (52 cmds)', value: '`&help antinuke`\nKIKI defense, auto-restore, whitelist', inline: true },
    { name: '🔨 Moderation (239 cmds)', value: '`&help moderation`\nBan, kick, mute, purge, lock, slowmode', inline: true },
    { name: '⚙️ Administration (195 cmds)', value: '`&help admin`\nVoice Master, tickets, autorole, modlogs', inline: true },
    { name: '📊 Utility & Tools (256 cmds)', value: '`&help utility`\nServerinfo, userinfo, avatar, banner', inline: true },
    { name: '🎭 Gothic Arts & Fun (178 cmds)', value: '`&help fun`\nTarot, dark quotes, 8ball, roasts', inline: true },
    { name: '🚨 Security Scanners (120 cmds)', value: '`&help security`\nRaid shields, alt-block, perm sweeps', inline: true },
    { name: '💥 Server Cleanup (34 cmds)', value: '`&help nuke`\nChannel clone, unban-all, purge-bots', inline: true },
    { name: '🪙 Gothic Economy (20 cmds)', value: '`&help economy`\nDark wallet, bank, shop, daily bonus', inline: true },
    { name: '🎮 Mini Games (20 cmds)', value: '`&help games`\nTrivia, blackjack, slots, riddles', inline: true },
    { name: '👥 Social & Union (15 cmds)', value: '`&help social`\nProfiles, marriage, reputation, badges', inline: true }
  );

  return embed;
}

function buildCategoryEmbed(category) {
  const meta = CATEGORY_META[category] || { name: category.toUpperCase(), emoji: '🔮', desc: 'Category commands' };
  const cmds = getCategoryCommands(category);
  const p = config.PREFIX;

  const embed = KikiEmbed.purple(
    `${meta.emoji} ${meta.name} — [${cmds.length} Commands]`,
    `*${meta.desc}*\n\n` +
    `💡 *Execute any command with \`${p}<cmd>\` or \`/<cmd>\`*\n` +
    `• Total Commands: **${cmds.length}**`
  );

  // Split commands into safe fields under 900 characters (Discord limit is 1024 per field, 4096 per description)
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
  if (currentChunk.length) {
    chunks.push(currentChunk.join(', '));
  }

  chunks.forEach((chunk, index) => {
    const fieldTitle = chunks.length === 1
      ? `📜 Commands (${cmds.length})`
      : `📜 Commands (Part ${index + 1}/${chunks.length})`;
    embed.addFields({ name: fieldTitle, value: chunk, inline: false });
  });

  return embed;
}

function buildAllCommandsEmbed(page = 1) {
  const categories = Object.keys(CATEGORY_META);
  const p = config.PREFIX;

  // Split categories across pages
  let selectedCats = [];
  if (page === 1) selectedCats = ['antinuke', 'moderation'];
  else if (page === 2) selectedCats = ['admin', 'utility'];
  else if (page === 3) selectedCats = ['fun', 'security'];
  else selectedCats = ['nuke', 'economy', 'games', 'social'];

  let totalPageCmds = 0;
  const embed = KikiEmbed.purple(
    `📜 Complete Command Directory — Page ${page}/4`,
    `Browse all 1,114+ commands available in KIKI bot!\nPrefix: \`${p}\` | Slash: \`/<cmd>\``
  );

  for (const cat of selectedCats) {
    const meta = CATEGORY_META[cat];
    const cmds = getCategoryCommands(cat);
    totalPageCmds += cmds.length;
    const list = cmds.map(c => `\`${c}\``).join(', ');
    embed.addFields({
      name: `${meta.emoji} ${meta.name} (${cmds.length} commands)`,
      value: list.length > 1024 ? list.slice(0, 1020) + '...' : list,
      inline: false
    });
  }

  embed.setFooter({ text: `Page ${page}/4 • Showing ${totalPageCmds} commands on this page` });
  return embed;
}

function buildSelectMenu() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('help_category')
    .setPlaceholder('🔮 Select a Command Category (800+ Commands)...')
    .addOptions([
      { label: 'Main Menu / Overview', description: 'Return to the main help portal', value: 'cat_home', emoji: '🏠' },
      { label: 'Anti-Nuke & Defense (52)', description: 'KIKI anti-nuke, whitelist, auto-restore', value: 'cat_antinuke', emoji: '🛡️' },
      { label: 'Moderation & Controls (239)', description: 'Ban, kick, timeout, purge, lock, slowmode', value: 'cat_moderation', emoji: '🔨' },
      { label: 'Server Setup & Admin (195)', description: 'Voice Master, tickets, autorole, modlogs', value: 'cat_admin', emoji: '⚙️' },
      { label: 'Utility & Diagnostics (256)', description: 'Serverinfo, userinfo, avatar, banner, ping', value: 'cat_utility', emoji: '📊' },
      { label: 'Gothic Arts & Fun (178)', description: 'Tarot, dark quotes, 8ball, roasts', value: 'cat_fun', emoji: '🎭' },
      { label: 'Security & Shields (120)', description: 'Raid scanners, perm audits, alt-block', value: 'cat_security', emoji: '🚨' },
      { label: 'Server Cleanup / Nuke (34)', description: 'Channel clones, mass cleanups, unban-all', value: 'cat_nuke', emoji: '💥' },
      { label: 'Gothic Economy (20)', description: 'Dark coins, shop, daily rewards, bank', value: 'cat_economy', emoji: '🪙' },
      { label: 'Interactive Games (20)', description: 'Trivia, blackjack, slots, riddles', value: 'cat_games', emoji: '🎮' },
      { label: 'Social & Marriage (15)', description: 'Profiles, badges, marriage unions, rep', value: 'cat_social', emoji: '👥' },
      { label: 'Browse All 1,114+ Commands', description: 'View complete directory of all commands', value: 'cat_all', emoji: '📜' }
    ]);

  return new ActionRowBuilder().addComponents(select);
}

function buildButtons(currentCat = 'home') {
  const b1 = new ButtonBuilder().setCustomId('help_btn_antinuke').setLabel('Anti-Nuke (52)').setStyle(ButtonStyle.Secondary).setEmoji('🛡️');
  const b2 = new ButtonBuilder().setCustomId('help_btn_moderation').setLabel('Mod (239)').setStyle(ButtonStyle.Secondary).setEmoji('🔨');
  const b3 = new ButtonBuilder().setCustomId('help_btn_admin').setLabel('Admin (195)').setStyle(ButtonStyle.Secondary).setEmoji('⚙️');
  const b4 = new ButtonBuilder().setCustomId('help_btn_utility').setLabel('Utility (256)').setStyle(ButtonStyle.Secondary).setEmoji('📊');
  const b5 = new ButtonBuilder().setCustomId('help_btn_all_1').setLabel('All 800+').setStyle(ButtonStyle.Primary).setEmoji('📜');

  return new ActionRowBuilder().addComponents(b1, b2, b3, b4, b5);
}

function buildInviteRow(clientId) {
  const KIKI = require('../../utils/kiki.js');
  const inviteUrl = KIKI.getBotInviteUrl(clientId);
  const inviteBtn = new ButtonBuilder()
    .setLabel('➕ Add KIKI to Server')
    .setStyle(ButtonStyle.Link)
    .setURL(inviteUrl);
  return new ActionRowBuilder().addComponents(inviteBtn);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('🔮 View KIKI Gothic Purple command library (1,114+ Commands)')
    .addStringOption(o =>
      o.setName('category')
        .setDescription('Specific category to inspect')
        .addChoices(
          { name: 'All Commands (800+)', value: 'all' },
          { name: 'Anti-Nuke & Defense (52)', value: 'antinuke' },
          { name: 'Moderation & Controls (239)', value: 'moderation' },
          { name: 'Server Setup & Admin (195)', value: 'admin' },
          { name: 'Utility & Tools (256)', value: 'utility' },
          { name: 'Gothic Arts & Fun (178)', value: 'fun' },
          { name: 'Security & Shields (120)', value: 'security' },
          { name: 'Server Cleanup (34)', value: 'nuke' },
          { name: 'Gothic Economy (20)', value: 'economy' },
          { name: 'Interactive Games (20)', value: 'games' },
          { name: 'Social & Marriage (15)', value: 'social' }
        )
    ),

  async execute(interaction, client) {
    const cat = interaction.options.getString('category');
    const totalCmds = client.totalCommands || 1114;

    try {
      if (cat === 'all') {
        const embed = buildAllCommandsEmbed(1);
        const row = buildSelectMenu();
        const p1 = new ButtonBuilder().setCustomId('help_page_1').setLabel('Page 1').setStyle(ButtonStyle.Primary);
        const p2 = new ButtonBuilder().setCustomId('help_page_2').setLabel('Page 2').setStyle(ButtonStyle.Secondary);
        const p3 = new ButtonBuilder().setCustomId('help_page_3').setLabel('Page 3').setStyle(ButtonStyle.Secondary);
        const p4 = new ButtonBuilder().setCustomId('help_page_4').setLabel('Page 4').setStyle(ButtonStyle.Secondary);
        const pRow = new ActionRowBuilder().addComponents(p1, p2, p3, p4);
        return await interaction.reply({ embeds: [embed], components: [row, pRow] });
      }

      if (cat && CATEGORY_META[cat]) {
        const embed = buildCategoryEmbed(cat);
        const row = buildSelectMenu();
        const bRow = buildButtons(cat);
        return await interaction.reply({ embeds: [embed], components: [row, bRow] });
      }

      const embed = buildMainMenuEmbed(totalCmds);
      const row = buildSelectMenu();
      const bRow = buildButtons('home');
      const iRow = buildInviteRow(client.user?.id);
      await interaction.reply({ embeds: [embed], components: [row, bRow, iRow] });
    } catch (err) {
      console.error('[HELP EXECUTE ERROR]', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ Help menu load karne me error aaya: ' + err.message, ephemeral: true });
      }
    }
  },

  async handleSelect(interaction, client) {
    try {
      const val = interaction.values[0];
      const totalCmds = client.totalCommands || 1114;

      if (val === 'cat_home') {
        const embed = buildMainMenuEmbed(totalCmds);
        return await interaction.update({ embeds: [embed], components: [buildSelectMenu(), buildButtons('home')] });
      }

      if (val === 'cat_all') {
        const embed = buildAllCommandsEmbed(1);
        const p1 = new ButtonBuilder().setCustomId('help_page_1').setLabel('Page 1').setStyle(ButtonStyle.Primary);
        const p2 = new ButtonBuilder().setCustomId('help_page_2').setLabel('Page 2').setStyle(ButtonStyle.Secondary);
        const p3 = new ButtonBuilder().setCustomId('help_page_3').setLabel('Page 3').setStyle(ButtonStyle.Secondary);
        const p4 = new ButtonBuilder().setCustomId('help_page_4').setLabel('Page 4').setStyle(ButtonStyle.Secondary);
        const pRow = new ActionRowBuilder().addComponents(p1, p2, p3, p4);
        return await interaction.update({ embeds: [embed], components: [buildSelectMenu(), pRow] });
      }

      const categoryKey = val.replace('cat_', '');
      if (CATEGORY_META[categoryKey]) {
        const embed = buildCategoryEmbed(categoryKey);
        return await interaction.update({ embeds: [embed], components: [buildSelectMenu(), buildButtons(categoryKey)] });
      }
    } catch (err) {
      console.error('[HELP SELECT ERROR]', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ Category switch karne me error aaya: ' + err.message, ephemeral: true }).catch(() => {});
      }
    }
  },

  async handleButton(interaction, client) {
    try {
      const id = interaction.customId;
      const totalCmds = client.totalCommands || 1114;

      if (id.startsWith('help_page_')) {
        const page = parseInt(id.replace('help_page_', '')) || 1;
        const embed = buildAllCommandsEmbed(page);
        const p1 = new ButtonBuilder().setCustomId('help_page_1').setLabel('Page 1').setStyle(page === 1 ? ButtonStyle.Primary : ButtonStyle.Secondary);
        const p2 = new ButtonBuilder().setCustomId('help_page_2').setLabel('Page 2').setStyle(page === 2 ? ButtonStyle.Primary : ButtonStyle.Secondary);
        const p3 = new ButtonBuilder().setCustomId('help_page_3').setLabel('Page 3').setStyle(page === 3 ? ButtonStyle.Primary : ButtonStyle.Secondary);
        const p4 = new ButtonBuilder().setCustomId('help_page_4').setLabel('Page 4').setStyle(page === 4 ? ButtonStyle.Primary : ButtonStyle.Secondary);
        const pRow = new ActionRowBuilder().addComponents(p1, p2, p3, p4);
        return await interaction.update({ embeds: [embed], components: [buildSelectMenu(), pRow] });
      }

      if (id === 'help_btn_all_1') {
        const embed = buildAllCommandsEmbed(1);
        const p1 = new ButtonBuilder().setCustomId('help_page_1').setLabel('Page 1').setStyle(ButtonStyle.Primary);
        const p2 = new ButtonBuilder().setCustomId('help_page_2').setLabel('Page 2').setStyle(ButtonStyle.Secondary);
        const p3 = new ButtonBuilder().setCustomId('help_page_3').setLabel('Page 3').setStyle(ButtonStyle.Secondary);
        const p4 = new ButtonBuilder().setCustomId('help_page_4').setLabel('Page 4').setStyle(ButtonStyle.Secondary);
        const pRow = new ActionRowBuilder().addComponents(p1, p2, p3, p4);
        return await interaction.update({ embeds: [embed], components: [buildSelectMenu(), pRow] });
      }

      if (id.startsWith('help_btn_')) {
        const cat = id.replace('help_btn_', '');
        if (CATEGORY_META[cat]) {
          const embed = buildCategoryEmbed(cat);
          return await interaction.update({ embeds: [embed], components: [buildSelectMenu(), buildButtons(cat)] });
        }
      }
    } catch (err) {
      console.error('[HELP BUTTON ERROR]', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ Button action perform karne me error aaya: ' + err.message, ephemeral: true }).catch(() => {});
      }
    }
  },

  name: 'help',
  aliases: ['h', 'commands', 'cmds'],
  async run(message, args, client) {
    const totalCmds = client.totalCommands || 1114;
    const query = args[0]?.toLowerCase();

    if (query === 'all') {
      const embed = buildAllCommandsEmbed(1);
      const p1 = new ButtonBuilder().setCustomId('help_page_1').setLabel('Page 1').setStyle(ButtonStyle.Primary);
      const p2 = new ButtonBuilder().setCustomId('help_page_2').setLabel('Page 2').setStyle(ButtonStyle.Secondary);
      const p3 = new ButtonBuilder().setCustomId('help_page_3').setLabel('Page 3').setStyle(ButtonStyle.Secondary);
      const p4 = new ButtonBuilder().setCustomId('help_page_4').setLabel('Page 4').setStyle(ButtonStyle.Secondary);
      const pRow = new ActionRowBuilder().addComponents(p1, p2, p3, p4);
      return message.reply({ embeds: [embed], components: [buildSelectMenu(), pRow] });
    }

    // Direct category query
    if (query && CATEGORY_META[query]) {
      const embed = buildCategoryEmbed(query);
      return message.reply({ embeds: [embed], components: [buildSelectMenu(), buildButtons(query)] });
    }

    // Check aliases for categories
    const aliasMap = {
      an: 'antinuke', security: 'security', mod: 'moderation',
      admin: 'admin', util: 'utility', fun: 'fun', eco: 'economy',
      game: 'games', nuke: 'nuke', soc: 'social'
    };
    if (query && aliasMap[query]) {
      const embed = buildCategoryEmbed(aliasMap[query]);
      return message.reply({ embeds: [embed], components: [buildSelectMenu(), buildButtons(aliasMap[query])] });
    }

    // Single command query
    if (query) {
      const cmd = client.prefixCommands.get(query) || client.commands.get(query);
      if (cmd) {
        const desc = cmd.data?.description || cmd.description || 'Gothic command';
        const aliases = cmd.aliases?.length ? cmd.aliases.map(a => `\`${a}\``).join(', ') : 'None';
        const embed = KikiEmbed.purple(
          `Command Details: ${query}`,
          `**Name:** \`${query}\`\n` +
          `**Description:** ${desc}\n` +
          `**Aliases:** ${aliases}\n` +
          `**Usage:** \`${config.PREFIX}${query}\` or \`/${query}\``
        );
        return message.reply({ embeds: [embed] });
      }
    }

    // Default main menu
    const embed = buildMainMenuEmbed(totalCmds);
    const row = buildSelectMenu();
    const bRow = buildButtons('home');
    const iRow = buildInviteRow(client.user?.id);
    message.reply({ embeds: [embed], components: [row, bRow, iRow] });
  }
};
