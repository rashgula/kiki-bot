// KIKI Bot - Invite Tracker Management & Setup Command
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const InviteTracker = require('../../utils/inviteTracker.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invitetracker')
    .setDescription('📩 Setup and manage the Invite Tracker category and real-time logs channel (Admin Only)')
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('⚡ 1-Click: Auto-create "📩〢INVITE TRACKER" category and "📩〢invite-logs" channel')
    )
    .addSubcommand(sub =>
      sub.setName('setchannel')
        .setDescription('📌 Set a custom channel for invite join/leave logs')
        .addChannelOption(o =>
          o.setName('channel')
            .setDescription('Select target text channel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('sync')
        .setDescription('🔄 Force re-sync cached invites with Discord API')
    )
    .addSubcommand(sub =>
      sub.setName('stats')
        .setDescription('📊 View current invite tracker configuration & stats')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id) && !KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf Server Owner ya Whitelisted members hi Invite Tracker setup kar sakte hain!')],
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      await interaction.deferReply();
      try {
        const res = await InviteTracker.setup(interaction.guild, client);
        const embed = KikiEmbed.success(
          'Invite Tracker Setup Completed 📩',
          `Invite Tracker category aur logs channel successfully create aur configure ho chuka hai!\n\n` +
          `📁 **Category:** ${res.category.name} (\`${res.category.id}\`)\n` +
          `💬 **Logs Channel:** ${res.channel.toString()} (\`${res.channel.id}\`)\n` +
          `⚡ **Cached Invites:** \`${res.cachedCount}\` invites loaded into memory\n\n` +
          `> ✨ *Ab jab bhi koi server me join karega, kisne invite kiya aur inviter ke all-time invites log honge!*\n` +
          `> 💾 *Bot reboot hone par bhi ye automatically active rahega!*`
        );
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ embeds: [KikiEmbed.error('Setup Error', err.message)] });
      }
    }

    if (sub === 'setchannel') {
      const channel = interaction.options.getChannel('channel');
      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[interaction.guildId]) cfg.guilds[interaction.guildId] = {};
      cfg.guilds[interaction.guildId].invite_tracker_channel_id = channel.id;
      cfg.guilds[interaction.guildId].invite_tracker_enabled = true;
      if (!cfg.invite_tracker_channel_id) {
        cfg.invite_tracker_channel_id = channel.id;
        cfg.invite_tracker_enabled = true;
      }
      KIKI.saveConfig(cfg);

      const embed = KikiEmbed.success(
        'Invite Logs Channel Linked 📌',
        `Invite join & leave logs ab ${channel.toString()} me bhejhe jayenge!`
      );
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'sync') {
      await interaction.deferReply();
      await InviteTracker.cacheGuildInvites(interaction.guild);
      const embed = KikiEmbed.success(
        'Invite Cache Synced 🔄',
        `Server ke saare active invites Discord ke sath successfully re-sync ho chuke hain!`
      );
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'stats') {
      const cfg = KIKI.loadConfig();
      const chId = cfg.invite_tracker_channel_id;
      const catId = cfg.invite_tracker_category_id;
      const ch = chId ? interaction.guild.channels.cache.get(chId) : null;
      const cat = catId ? interaction.guild.channels.cache.get(catId) : null;

      const embed = KikiEmbed.info(
        'Invite Tracker Configuration 📊',
        `• **Status:** ${cfg.invite_tracker_enabled !== false ? '🟢 Active' : '🔴 Disabled'}\n` +
        `• **Category:** ${cat ? cat.name : '`Not Set`'}\n` +
        `• **Logs Channel:** ${ch ? ch.toString() : '`Not Set`'}`
      );
      return interaction.reply({ embeds: [embed] });
    }
  },

  name: 'invitetracker',
  aliases: ['invtrack', 'invsetup', 'invitetracker-setup'],
  description: 'Setup and manage Invite Tracker category and logs channel',
  category: 'admin',
  usage: '&invitetracker [setup|setchannel #channel|sync|stats]',

  async run(client, message, args) {
    if (!KIKI.isServerOrBotOwner(message.guild, message.author.id) && !KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.channel.send({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf Server Owner ya Whitelisted members hi Invite Tracker setup kar sakte hain!')]
      });
    }

    const sub = (args[0] || 'setup').toLowerCase();

    if (sub === 'setup') {
      const waitMsg = await message.channel.send({
        embeds: [KikiEmbed.info('Setting up Invite Tracker...', 'Category aur logs channel create ho rahe hain...')]
      });

      try {
        const res = await InviteTracker.setup(message.guild, client);
        const embed = KikiEmbed.success(
          'Invite Tracker Setup Completed 📩',
          `Invite Tracker category aur logs channel successfully create aur configure ho chuka hai!\n\n` +
          `📁 **Category:** ${res.category.name} (\`${res.category.id}\`)\n` +
          `💬 **Logs Channel:** ${res.channel.toString()} (\`${res.channel.id}\`)\n` +
          `⚡ **Cached Invites:** \`${res.cachedCount}\` invites loaded into memory\n\n` +
          `> ✨ *Ab jab bhi koi server me join karega, kisne invite kiya aur inviter ke all-time invites log honge!*\n` +
          `> 💾 *Bot reboot hone par bhi ye automatically active rahega!*`
        );
        return waitMsg.edit({ embeds: [embed] });
      } catch (err) {
        return waitMsg.edit({ embeds: [KikiEmbed.error('Setup Error', err.message)] });
      }
    }

    if (sub === 'setchannel') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) {
        return message.channel.send({
          embeds: [KikiEmbed.error('Channel Error', 'Kripya target text channel mention karein! (e.g. `&invitetracker setchannel #invite-logs`)')]
        });
      }

      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[message.guild.id]) cfg.guilds[message.guild.id] = {};
      cfg.guilds[message.guild.id].invite_tracker_channel_id = channel.id;
      cfg.guilds[message.guild.id].invite_tracker_enabled = true;
      if (!cfg.invite_tracker_channel_id) {
        cfg.invite_tracker_channel_id = channel.id;
        cfg.invite_tracker_enabled = true;
      }
      KIKI.saveConfig(cfg);

      const embed = KikiEmbed.success(
        'Invite Logs Channel Linked 📌',
        `Invite join & leave logs ab ${channel.toString()} me bhejhe jayenge!`
      );
      return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'sync') {
      await InviteTracker.cacheGuildInvites(message.guild);
      const embed = KikiEmbed.success(
        'Invite Cache Synced 🔄',
        `Server ke saare active invites Discord ke sath successfully re-sync ho chuke hain!`
      );
      return message.channel.send({ embeds: [embed] });
    }

    // Default / stats
    const cfg = KIKI.loadConfig();
    const chId = cfg.invite_tracker_channel_id;
    const catId = cfg.invite_tracker_category_id;
    const ch = chId ? message.guild.channels.cache.get(chId) : null;
    const cat = catId ? message.guild.channels.cache.get(catId) : null;

    const embed = KikiEmbed.info(
      'Invite Tracker Status 📊',
      `• **Status:** ${cfg.invite_tracker_enabled !== false ? '🟢 Active' : '🔴 Disabled'}\n` +
      `• **Category:** ${cat ? cat.name : '`Not Set`'}\n` +
      `• **Logs Channel:** ${ch ? ch.toString() : '`Not Set`'}\n\n` +
      `*Setup chalane ke liye: \`&invitetracker setup\`*`
    );
    return message.channel.send({ embeds: [embed] });
  }
};
