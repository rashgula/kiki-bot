// KIKI Bot - Bot Command & Security Whitelist System
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('🛡️ KIKI Bot command access aur Anti-Nuke whitelist manage karein')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Member ko bot commands aur whitelist me add karein')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Member ko whitelist se remove karein')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Sabhi whitelisted members ki list dekhein')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isOwner(interaction.user.id) && interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf **Server Owner** ya **Bot Owner** hi whitelist manage kar sakte hain!')],
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    const cfg = KIKI.loadConfig();
    if (!cfg.whitelist) cfg.whitelist = [];

    if (sub === 'add') {
      const user = interaction.options.getUser('user');
      if (cfg.whitelist.includes(user.id)) {
        return interaction.reply({
          embeds: [KikiEmbed.warn('Already Whitelisted', `${user.toString()} (\`${user.tag}\`) pehle se whitelist me hai.`)],
          ephemeral: true
        });
      }

      cfg.whitelist.push(user.id);
      KIKI.saveConfig(cfg);

      return interaction.reply({
        embeds: [KikiEmbed.success('Whitelist Added', `✅ ${user.toString()} (\`${user.tag}\`) ko KIKI Bot Whitelist me add kar diya gaya hai!\nAb ye user bot ki commands use kar sakta hai.`)]
      });
    }

    if (sub === 'remove') {
      const user = interaction.options.getUser('user');
      if (!cfg.whitelist.includes(user.id)) {
        return interaction.reply({
          embeds: [KikiEmbed.warn('Not Found', `${user.toString()} whitelist me nahi hai.`)],
          ephemeral: true
        });
      }

      cfg.whitelist = cfg.whitelist.filter(id => id !== user.id);
      KIKI.saveConfig(cfg);

      return interaction.reply({
        embeds: [KikiEmbed.success('Whitelist Removed', `🗑️ ${user.toString()} (\`${user.tag}\`) ko whitelist se remove kar diya gaya hai.`)]
      });
    }

    if (sub === 'list') {
      if (cfg.whitelist.length === 0) {
        return interaction.reply({
          embeds: [KikiEmbed.info('Whitelist Empty', 'Abhi koi bhi user whitelisted nahi hai. Sirf Server Owner bot use kar sakta hai.')]
        });
      }

      const list = cfg.whitelist.map((id, i) => `${i + 1}. <@${id}> (\`${id}\`)`).join('\n');
      return interaction.reply({
        embeds: [KikiEmbed.purple('🛡️ KIKI Whitelisted Users', `Niche diye gaye users bot commands aur defense bypass use kar sakte hain:\n\n${list}`)]
      });
    }
  },

  name: 'whitelist',
  aliases: ['wl'],
  async run(message, args, client) {
    if (!KIKI.isOwner(message.author.id) && message.guild.ownerId !== message.author.id) {
      return message.reply({
        embeds: [KikiEmbed.error('Access Denied', 'Sirf **Server Owner** ya **Bot Owner** hi whitelist manage kar sakte hain!')]
      });
    }

    const cfg = KIKI.loadConfig();
    if (!cfg.whitelist) cfg.whitelist = [];
    const action = args[0]?.toLowerCase();

    // 1. ADD
    if (action === 'add') {
      let targetUser = message.mentions?.users?.first?.();
      const rawId = args[1]?.replace(/[<@!>]/g, '');

      if (!targetUser && rawId && /^\d{17,20}$/.test(rawId)) {
        targetUser = await client.users.fetch(rawId).catch(() => null);
      }

      if (!targetUser && !rawId) {
        return message.reply('❌ User mention karein ya User ID dein! Jaise: `&wl add @user` ya `&wl add 1234567890`');
      }

      const userId = targetUser ? targetUser.id : rawId;
      const userTag = targetUser ? targetUser.tag : rawId;

      if (cfg.whitelist.includes(userId)) {
        return message.reply({
          embeds: [KikiEmbed.warn('Already Whitelisted', `<@${userId}> pehle se whitelist me shamil hai.`)]
        });
      }

      cfg.whitelist.push(userId);
      KIKI.saveConfig(cfg);

      return message.reply({
        embeds: [KikiEmbed.success('Whitelist Added', `✅ <@${userId}> (\`${userTag}\`) ko KIKI Whitelist me add kar diya gaya!\nAb ye user bot ki commands execute kar sakta hai.`)]
      });
    }

    // 2. REMOVE
    if (action === 'remove' || action === 'del' || action === 'delete') {
      let targetUser = message.mentions?.users?.first?.();
      const rawId = args[1]?.replace(/[<@!>]/g, '');
      const userId = targetUser ? targetUser.id : rawId;

      if (!userId) {
        return message.reply('❌ User mention karein ya User ID dein jise hatana hai! Jaise: `&wl remove @user`');
      }

      if (!cfg.whitelist.includes(userId)) {
        return message.reply({
          embeds: [KikiEmbed.warn('Not Whitelisted', `<@${userId}> whitelist me nahi mila.`)]
        });
      }

      cfg.whitelist = cfg.whitelist.filter(id => id !== userId);
      KIKI.saveConfig(cfg);

      return message.reply({
        embeds: [KikiEmbed.success('Whitelist Removed', `🗑️ <@${userId}> ko whitelist se successfully hata diya gaya.`)]
      });
    }

    // 3. CLEAR
    if (action === 'clear' || action === 'reset') {
      cfg.whitelist = [];
      KIKI.saveConfig(cfg);
      return message.reply({
        embeds: [KikiEmbed.warn('Whitelist Cleared', '🧹 Saari whitelist clear kar di gayi hai! Ab sirf Server Owner bot use kar sakega.')]
      });
    }

    // 4. LIST (Default)
    if (action === 'list' || !action) {
      if (cfg.whitelist.length === 0) {
        return message.reply({
          embeds: [KikiEmbed.info('Whitelist Empty', 'Abhi koi bhi user whitelisted nahi hai. Sirf Server Owner bot use kar sakta hai.\n\nKisi ko add karne ke liye: `&wl add @user`')]
        });
      }

      const list = cfg.whitelist.map((id, i) => `${i + 1}. <@${id}> (\`${id}\`)`).join('\n');
      return message.reply({
        embeds: [KikiEmbed.purple('🛡️ KIKI Whitelisted Users', `Niche diye gaye users bot commands use kar sakte hain:\n\n${list}\n\n*Naye user ko add karne ke liye: \`&wl add @user\`*`)]
      });
    }
  }
};
