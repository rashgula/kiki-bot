const config = require('../config.js');
const KikiEmbed = require('../utils/embed.js');
const KIKI = require('../utils/kiki.js');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // ── CACHE MESSAGE FOR ACCURATE DELETE & EDIT LOGS ────────────
    try {
      const MessageCache = require('../utils/messageCache.js');
      MessageCache.add(message);
    } catch {}

    // ── CHAT XP & LEVELING TRACKER ────────────────────────────────
    try {
      const Leveling = require('../utils/leveling.js');
      Leveling.addChatXp(message.guild, message.member, message.channel).catch(() => {});
    } catch {}

    const prefix = KIKI.getGuildConfig(message.guild.id, 'prefix', config.PREFIX) || '&';

    // ── AFK STATUS AUTO-CLEAR & MENTION NOTICES ───────────────────
    try {
      const AFK = require('../utils/afk.js');
      const lowerContent = message.content.toLowerCase();
      const isAfkCmd = lowerContent.startsWith(`${prefix}afk`);
      if (!isAfkCmd) {
        const prevAfk = AFK.clearAfk(message.guild.id, message.author.id);
        if (prevAfk) {
          const ago = KIKI.formatDuration(Date.now() - prevAfk.since);
          message.reply({ content: `🌙 Welcome back ${message.author.toString()}! Aapka AFK status remove kar diya gaya hai *(AFK for ${ago})*.` })
            .then(m => setTimeout(() => m.delete().catch(() => {}), 8000))
            .catch(() => {});
        }
      }
      if (message.mentions?.users?.size > 0) {
        for (const [, mentioned] of message.mentions.users) {
          if (mentioned.bot || mentioned.id === message.author.id) continue;
          const info = AFK.getAfk(message.guild.id, mentioned.id);
          if (info) {
            const ago = KIKI.formatDuration(Date.now() - info.since);
            message.reply({ content: `💤 **${mentioned.username}** abhi AFK hain (*${ago} ago*): **${info.reason}**` })
              .then(m => setTimeout(() => m.delete().catch(() => {}), 10000))
              .catch(() => {});
            break;
          }
        }
      }
    } catch {}

    const cfg = KIKI.loadConfig();
    const isMasterOn = cfg.master_antinuke !== false && cfg.antinuke !== false;

    // ── MASTER ANTI-NUKE CHAT DEFENSE ────────────────────────────
    if (isMasterOn && !KIKI.isSafe(message.guild, message.author.id, client)) {
      // 1. Anti-Everyone / Anti-Here Mention
      if (message.content.includes('@everyone') || message.content.includes('@here')) {
        try {
          await message.delete();
          await message.member.timeout(3600000, '[KIKI Master Anti-Nuke] Unauthorized @everyone ping');
          const alert = KikiEmbed.warn(
            'Anti-Everyone Defense 🚨',
            `${message.author.toString()} has been timed out for 1 hour for attempting an unauthorized \`@everyone\` mention under KIKI Master Anti-Nuke Shield.`
          );
          return message.channel.send({ embeds: [alert] });
        } catch {}
      }

      // 2. Anti-Mass-Mention (>3 user/role mentions)
      if ((message.mentions?.users?.size || 0) > 3 || (message.mentions?.roles?.size || 0) > 3) {
        try {
          await message.delete();
          await message.member.timeout(1800000, '[KIKI Master Anti-Nuke] Mass mention flood');
          const alert = KikiEmbed.warn(
            'Anti-Mass-Mention Defense 🚨',
            `${message.author.toString()} has been timed out for 30 minutes for mass mentioning members.`
          );
          return message.channel.send({ embeds: [alert] });
        } catch {}
      }

      // 3. Anti-Discord Invite Links
      const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
      if (inviteRegex.test(message.content)) {
        try {
          await message.delete();
          const alert = KikiEmbed.warn(
            'Anti-Invite Shield 🛡️',
            `⚠️ ${message.author.toString()}, external Discord invite links are blocked by KIKI Master Anti-Nuke Shield!`
          );
          return message.channel.send({ embeds: [alert] });
        } catch {}
      }
    }

    // ── PREFIX COMMANDS EXECUTION ────────────────────────────────
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Smart command resolution: direct, dash-free, or fuzzy prefix
    let command = client.prefixCommands?.get(commandName);
    if (!command) {
      const noDash = commandName.replace(/-/g, '');
      command = client.prefixCommands?.get(noDash);
    }
    if (!command) {
      command = client.prefixCommands?.find((cmd, key) =>
        key === commandName ||
        key.startsWith(commandName + '-') ||
        (cmd.aliases && cmd.aliases.includes(commandName))
      );
    }
    if (!command) return;

    const cat = (command.category || '').toLowerCase();

    // ── STRICT ANTINUKE & DESTRUCTIVE NUKE OWNERSHIP GUARD ───────────
    const isAntiNukeCmd = cat === 'antinuke' || cat === 'nuke' ||
      commandName === 'antinuke' || commandName === 'master-antinuke' ||
      commandName === 'an' || commandName === 'man' || commandName === 'whitelist' || commandName === 'wl' ||
      commandName.startsWith('anti-') || commandName.startsWith('antinuke') || commandName.startsWith('nuke');

    if (isAntiNukeCmd && !KIKI.isServerOrBotOwner(message.guild, message.author.id)) {
      const deniedEmbed = KikiEmbed.error(
        'Ownership Required 👑',
        `⚠️ ${message.author.toString()}, Anti-Nuke security commands sirf **Server Owner** ya **Bot Owner** ke liye reserved hain!\nKisi aur ke paas isko ON / OFF karne ki permission nahi hai.`
      );
      return message.reply({ embeds: [deniedEmbed] });
    }

    // ── PERMISSION CHECK ───────────────────────────────────────────
    const isProtectedCategory = ['admin', 'moderation', 'security'].includes(cat);
    const isWhitelisted = KIKI.isSafe(message.guild, message.author.id, client);
    const isPublic = KIKI.isCommandPublic(commandName, command);

    if (isProtectedCategory) {
      const isOwner = KIKI.isServerOrBotOwner(message.guild, message.author.id);
      const hasStaffPerms = message.member?.permissions?.has('Administrator') ||
        message.member?.permissions?.has(['ManageGuild', 'BanMembers', 'KickMembers', 'ManageMessages', 'ManageRoles', 'ManageChannels'], false);

      if (!isOwner && !isWhitelisted && !hasStaffPerms) {
        const deniedEmbed = KikiEmbed.error(
          'Staff Permission Required 🛡️',
          `⚠️ ${message.author.toString()}, ye administrative command chalane ke liye aapke paas **Staff Permissions** ya **Whitelist** hona zaroori hai!`
        );
        return message.reply({ embeds: [deniedEmbed] }).then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 6000);
        }).catch(() => {});
      }
    } else if (!isWhitelisted && !isPublic) {
      const deniedEmbed = KikiEmbed.error(
        'Access Denied 🔒',
        `⚠️ ${message.author.toString()}, aap whitelisted nahi hain!\nSirf **Whitelisted members** hi ye command chala sakte hain.\n\n*Server Owner \`&cmdpanel\` se public commands allow kar sakte hain.*`
      );
      return message.reply({ embeds: [deniedEmbed] }).then(msg => {
        setTimeout(() => msg.delete().catch(() => {}), 6000);
      }).catch(() => {});
    }

    try {
      if (typeof command.run === 'function') {
        await command.run(message, args, client);
      } else if (typeof command.execute === 'function') {
        await command.execute(message, client);
      }

      // Auto-save command for automatic replay on restart
      if (isWhitelisted || KIKI.isServerOrBotOwner(message.guild, message.author.id)) {
        try {
          const CommandAutoExec = require('../utils/commandAutoExec.js');
          CommandAutoExec.recordCommand(commandName, args, message);
        } catch {}
      }
    } catch (err) {
      console.error(`[PREFIX CMD ERROR] ${commandName}:`, err);
      const errEmbed = KikiEmbed.error('Command Error', `\`\`\`${err.message}\`\`\``);
      message.reply({ embeds: [errEmbed] });
    }
  }
};
