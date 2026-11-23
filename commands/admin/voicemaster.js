// KIKI Bot - Voice Master Setup & Control Command
// Comprehensive dynamic temporary voice channel system with interactive control panel

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const VoiceMaster = require('../../utils/voiceMaster.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicemaster')
    .setDescription('🔊 Manage and setup Voice Master custom temporary voice channels')
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('🚀 Automatically setup Voice Master category, join-to-create VC, and control panel')
    )
    .addSubcommand(sub =>
      sub.setName('panel')
        .setDescription('📑 Resend the Voice Master interactive control panel')
    )
    .addSubcommand(sub =>
      sub.setName('setlog')
        .setDescription('📜 Set the Voice Master audit log channel')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Select the text channel for Voice Master logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('🗑️ Disable and reset the Voice Master configuration')
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const member = interaction.member;

    if (!KIKI.isSafe(guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf **Server Owner** ya **Whitelisted members** Voice Master setup ko modify kar sakte hain!')],
        ephemeral: true
      });
    }

    // ── 1. SETUP SUBCOMMAND ─────────────────────────────────────
    if (subcommand === 'setup') {
      await interaction.deferReply();

      try {
        const botMember = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
        if (!botMember || !botMember.permissions.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers])) {
          return interaction.editReply({
            embeds: [KikiEmbed.error('Permissions Missing ⚠️', 'KIKI ke paas **Manage Channels** aur **Move Members** permissions honi chahiye!')]
          });
        }

        const cfg = KIKI.loadConfig();

        // 1. Create or Find Category
        let category = cfg.voice_master_category_id ? guild.channels.cache.get(cfg.voice_master_category_id) : null;
        if (!category) {
          category = await guild.channels.create({
            name: '🔊〢Voice Master',
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
              {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
              }
            ],
            reason: 'Voice Master: Category setup'
          });
        }

        // 2. Create or Find Text Interface Channel
        let interfaceChannel = cfg.voice_master_interface_id ? guild.channels.cache.get(cfg.voice_master_interface_id) : null;
        if (!interfaceChannel) {
          interfaceChannel = await guild.channels.create({
            name: '🔊〢voice-control',
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
              {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages] // Clean interface, buttons only
              },
              {
                id: botMember.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
              }
            ],
            reason: 'Voice Master: Control interface channel'
          });
        }

        // 3. Create or Find Join-To-Create Voice Channel
        let joinChannel = cfg.voice_master_channel_id ? guild.channels.cache.get(cfg.voice_master_channel_id) : null;
        if (!joinChannel) {
          joinChannel = await guild.channels.create({
            name: '➕〢Join to Create',
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [
              {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
              }
            ],
            reason: 'Voice Master: Join to Create channel'
          });
        }

        // 4. Create or Find Audit Logs Channel
        let logChannel = cfg.voice_master_log_channel_id ? guild.channels.cache.get(cfg.voice_master_log_channel_id) : null;
        if (!logChannel) {
          logChannel = guild.channels.cache.find(c => c.parentId === category.id && (c.name.includes('vm-logs') || c.name.includes('voice-master-logs')));
          if (!logChannel) {
            logChannel = await guild.channels.create({
              name: '🔊〢vm-logs',
              type: ChannelType.GuildText,
              parent: category.id,
              permissionOverwrites: [
                {
                  id: guild.id,
                  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                  deny: [PermissionFlagsBits.SendMessages]
                },
                {
                  id: botMember.id,
                  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
                }
              ],
              reason: 'Voice Master: Dedicated audit logs channel'
            });
          }
        }

        // 5. Send or Resend Interface Panel
        const panelMessage = await interfaceChannel.send({
          embeds: [VoiceMaster.buildPanelEmbed()],
          components: VoiceMaster.buildPanelComponents()
        });

        // 6. Save Configuration (Multi-Server Isolated per Guild)
        if (!cfg.guilds) cfg.guilds = {};
        if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
        cfg.guilds[guild.id].voice_master_enabled = true;
        cfg.guilds[guild.id].voice_master_category_id = category.id;
        cfg.guilds[guild.id].voice_master_channel_id = joinChannel.id;
        cfg.guilds[guild.id].voice_master_interface_id = interfaceChannel.id;
        cfg.guilds[guild.id].voice_master_panel_message_id = panelMessage.id;
        cfg.guilds[guild.id].voice_master_log_channel_id = logChannel ? logChannel.id : null;
        if (!cfg.voice_master_channel_id) {
          cfg.voice_master_enabled = true;
          cfg.voice_master_category_id = category.id;
          cfg.voice_master_channel_id = joinChannel.id;
          cfg.voice_master_interface_id = interfaceChannel.id;
          cfg.voice_master_panel_message_id = panelMessage.id;
          cfg.voice_master_log_channel_id = logChannel ? logChannel.id : null;
        }
        KIKI.saveConfig(cfg);

        const successEmbed = KikiEmbed.build({
          title: '✅ Voice Master Setup Complete!',
          description:
            `Voice Master system successfully configure aur deploy ho gaya hai!\n\n` +
            `• 📁 **Category:** \`${category.name}\`\n` +
            `• ➕ **Join Channel:** ${joinChannel.toString()} (\`${joinChannel.name}\`)\n` +
            `• 🎛️ **Control Interface:** ${interfaceChannel.toString()}\n` +
            (logChannel ? `• 📜 **Audit Logs Channel:** ${logChannel.toString()}\n\n` : '\n') +
            `**⚡ Ye Kaise Kaam Karta Hai?**\n` +
            `1️⃣ Koi bhi member jab **${joinChannel.name}** me join karega, bot turant unke liye ek private temporary voice channel bana dega aur unhe usme move kar dega!\n` +
            `2️⃣ Member ${interfaceChannel.toString()} me jakar **Lock, Hide, Limit, Rename, Kick, Permit** buttons se apna VC control kar sakta hai.\n` +
            `3️⃣ Kisne VC banaya aur kya changes kiye, wo saare logs ${logChannel ? logChannel.toString() : 'logs channel'} me real-time report honge!\n` +
            `4️⃣ Jab sabhi members VC chhod denge, bot us temporary channel ko automatically delete kar dega!`,
          color: config.COLORS.GREEN || 0x2ECC71,
          footer: { text: `Voice Master System • KIKI v${config.BOT_VERSION}` }
        });

        return interaction.editReply({ embeds: [successEmbed] });
      } catch (err) {
        console.error('[VOICEMASTER SETUP ERROR]', err);
        return interaction.editReply({
          embeds: [KikiEmbed.error('Setup Error', `Voice Master setup karte waqt error aaya: ${err.message}`)]
        });
      }
    }

    // ── 2. SETLOG SUBCOMMAND ────────────────────────────────────
    if (subcommand === 'setlog') {
      const channel = interaction.options.getChannel('channel');
      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
      cfg.guilds[guild.id].voice_master_log_channel_id = channel.id;
      if (!cfg.voice_master_log_channel_id) cfg.voice_master_log_channel_id = channel.id;
      KIKI.saveConfig(cfg);

      return interaction.reply({
        embeds: [KikiEmbed.success('Log Channel Configured 📜', `Voice Master audit logs ab ${channel.toString()} me bhejey jayenge!`)],
        ephemeral: true
      });
    }

    // ── 2. PANEL SUBCOMMAND ─────────────────────────────────────
    if (subcommand === 'panel') {
      const cfg = KIKI.loadConfig();
      const gData = cfg.guilds?.[guild.id] || {};
      const interfaceId = gData.voice_master_interface_id || (guild.channels.cache.has(cfg.voice_master_interface_id) ? cfg.voice_master_interface_id : null);
      const targetChannel = interfaceId ? guild.channels.cache.get(interfaceId) : interaction.channel;

      if (!targetChannel) {
        return interaction.reply({
          embeds: [KikiEmbed.error('Channel Error', 'Control channel nahi mila! Pehle `/voicemaster setup` chalayein.')],
          ephemeral: true
        });
      }

      await targetChannel.send({
        embeds: [VoiceMaster.buildPanelEmbed()],
        components: VoiceMaster.buildPanelComponents()
      });

      return interaction.reply({
        embeds: [KikiEmbed.success('Panel Sent', `Voice Master Control Panel ${targetChannel.toString()} me bhej diya gaya hai!`)],
        ephemeral: true
      });
    }

    // ── 3. RESET SUBCOMMAND ─────────────────────────────────────
    if (subcommand === 'reset') {
      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
      cfg.guilds[guild.id].voice_master_enabled = false;
      cfg.guilds[guild.id].voice_master_channel_id = null;
      cfg.guilds[guild.id].voice_master_interface_id = null;
      cfg.guilds[guild.id].voice_master_category_id = null;
      cfg.guilds[guild.id].voice_master_log_channel_id = null;
      KIKI.saveConfig(cfg);

      return interaction.reply({
        embeds: [KikiEmbed.warn('Voice Master Reset', 'Voice Master configuration reset aur disable kar diya gaya hai.')]
      });
    }
  },

  name: 'voicemaster',
  aliases: ['vm', 'tempvc', 'jointocreate', 'vcpanel'],
  async run(message, args, client) {
    const sub = args[0]?.toLowerCase();
    const guild = message.guild;
    const member = message.member;

    // Direct Temporary VC Control Commands (lock, unlock, hide, unhide, rename, limit, kick, permit, claim, delete)
    if (['lock', 'unlock', 'hide', 'unhide', 'rename', 'limit', 'kick', 'permit', 'claim', 'delete'].includes(sub)) {
      const currentVc = member.voice?.channel;
      if (!currentVc) {
        return message.reply({
          embeds: [KikiEmbed.error('Not in Voice 🔇', 'Aapko pehle apne temporary voice channel me join hona hoga!')]
        });
      }

      const tempInfo = VoiceMaster.getTempChannel(currentVc.id);
      if (!tempInfo) {
        return message.reply({
          embeds: [KikiEmbed.error('Invalid Channel ⚠️', 'Ye voice channel Voice Master ka temporary channel nahi hai!')]
        });
      }

      const isOwner = tempInfo.ownerId === member.id;

      // Claim Command
      if (sub === 'claim') {
        const ownerInVc = currentVc.members.has(tempInfo.ownerId);
        if (isOwner) {
          return message.reply({ embeds: [KikiEmbed.warn('Already Owner', 'Aap pehle se hi is voice channel ke owner hain!')] });
        }
        if (ownerInVc) {
          return message.reply({ embeds: [KikiEmbed.warn('Owner Present', `Channel owner (<@${tempInfo.ownerId}>) abhi bhi VC me maujood hai!`)] });
        }
        const oldOwnerId = tempInfo.ownerId;
        tempInfo.ownerId = member.id;
        VoiceMaster.setTempChannel(currentVc.id, tempInfo);
        await currentVc.permissionOverwrites.edit(member.id, {
          ViewChannel: true, Connect: true, Speak: true, ManageChannels: true, MoveMembers: true
        }).catch(() => {});

        VoiceMaster.sendLog(guild, KikiEmbed.build({
          title: '👑 Voice Channel Ownership Claimed',
          description:
            `Voice channel ka naya owner claim kiya gaya hai!\n\n` +
            `• 👤 **Purana Owner:** <@${oldOwnerId}> (\`${oldOwnerId}\`)\n` +
            `• 👑 **Naya Owner:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
            `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: config.COLORS.GOLD || 0xF1C40F,
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        }));

        return message.reply({ embeds: [KikiEmbed.success('Owner Claimed 👑', `Aap ab is voice channel ke naye **Owner** hain!`)] });
      }

      if (!isOwner) {
        return message.reply({
          embeds: [KikiEmbed.error('Owner Only 🔒', `Sirf is channel ke owner (<@${tempInfo.ownerId}>) ye command use kar sakte hain!`)]
        });
      }

      if (sub === 'lock') {
        await currentVc.permissionOverwrites.edit(guild.id, { Connect: false });
        await currentVc.permissionOverwrites.edit(member.id, { Connect: true });
        tempInfo.isLocked = true;
        VoiceMaster.setTempChannel(currentVc.id, tempInfo);

        VoiceMaster.sendLog(guild, KikiEmbed.build({
          title: '🔒 Voice Channel Locked',
          description:
            `Voice channel ko lock kar diya gaya hai.\n\n` +
            `• 👤 **Action By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
            `• ℹ️ **Status:** \`Only permitted members can join\`\n` +
            `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: config.COLORS.GOLD || 0xF1C40F,
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        }));

        return message.reply({ embeds: [KikiEmbed.success('Channel Locked 🔒', 'Voice channel lock ho gaya hai!')] });
      }

      if (sub === 'unlock') {
        await currentVc.permissionOverwrites.edit(guild.id, { Connect: null });
        tempInfo.isLocked = false;
        VoiceMaster.setTempChannel(currentVc.id, tempInfo);

        VoiceMaster.sendLog(guild, KikiEmbed.build({
          title: '🔓 Voice Channel Unlocked',
          description:
            `Voice channel ko unlock kar diya gaya hai.\n\n` +
            `• 👤 **Action By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
            `• ℹ️ **Status:** \`Everyone can join\`\n` +
            `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: config.COLORS.GREEN || 0x2ECC71,
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        }));

        return message.reply({ embeds: [KikiEmbed.success('Channel Unlocked 🔓', 'Voice channel unlock ho gaya hai!')] });
      }

      if (sub === 'hide') {
        await currentVc.permissionOverwrites.edit(guild.id, { ViewChannel: false });
        await currentVc.permissionOverwrites.edit(member.id, { ViewChannel: true });
        tempInfo.isHidden = true;
        VoiceMaster.setTempChannel(currentVc.id, tempInfo);

        VoiceMaster.sendLog(guild, KikiEmbed.build({
          title: '👻 Voice Channel Hidden',
          description:
            `Voice channel ko hide kar diya gaya hai.\n\n` +
            `• 👤 **Action By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
            `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: config.COLORS.PRIMARY || 0x9B59B6,
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        }));

        return message.reply({ embeds: [KikiEmbed.success('Channel Hidden 👻', 'Voice channel hide ho gaya hai!')] });
      }

      if (sub === 'unhide') {
        await currentVc.permissionOverwrites.edit(guild.id, { ViewChannel: null });
        tempInfo.isHidden = false;
        VoiceMaster.setTempChannel(currentVc.id, tempInfo);

        VoiceMaster.sendLog(guild, KikiEmbed.build({
          title: '👁️ Voice Channel Unhidden',
          description:
            `Voice channel ko unhide kar diya gaya hai.\n\n` +
            `• 👤 **Action By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
            `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: config.COLORS.TEAL || 0x1ABC9C,
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        }));

        return message.reply({ embeds: [KikiEmbed.success('Channel Unhidden 👁️', 'Voice channel ab sabhi ko dikhai dega!')] });
      }

      if (sub === 'rename') {
        const newName = args.slice(1).join(' ').trim();
        if (!newName || newName.length > 50) {
          return message.reply({ embeds: [KikiEmbed.error('Invalid Name', 'Usage: `&vm rename <new channel name>`')] });
        }
        const oldName = currentVc.name;
        await currentVc.setName(newName);

        VoiceMaster.sendLog(guild, KikiEmbed.build({
          title: '✏️ Voice Channel Renamed',
          description:
            `Voice channel ka naam change kiya gaya hai.\n\n` +
            `• 👤 **Renamed By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• 📝 **Old Name:** \`#${oldName}\`\n` +
            `• 🏷️ **New Name:** \`#${newName}\`\n` +
            `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: config.COLORS.BLUE || 0x3498DB,
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        }));

        return message.reply({ embeds: [KikiEmbed.success('Renamed ✏️', `Channel renamed to **\`${newName}\`**!`)] });
      }

      if (sub === 'limit') {
        const limit = parseInt(args[1], 10);
        if (isNaN(limit) || limit < 0 || limit > 99) {
          return message.reply({ embeds: [KikiEmbed.error('Invalid Limit', 'Usage: `&vm limit <0-99>` (0 = unlimited)')] });
        }
        await currentVc.setUserLimit(limit);
        tempInfo.limit = limit;
        VoiceMaster.setTempChannel(currentVc.id, tempInfo);

        VoiceMaster.sendLog(guild, KikiEmbed.build({
          title: '👥 Channel Limit Updated',
          description:
            `Voice channel ki user limit update ki gayi hai.\n\n` +
            `• 👤 **Updated By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
            `• 🔢 **New Limit:** \`${limit === 0 ? 'Unlimited (0)' : `${limit} members`}\`\n` +
            `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: config.COLORS.TEAL || 0x1ABC9C,
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        }));

        return message.reply({ embeds: [KikiEmbed.success('Limit Updated 👥', `Channel user limit set to **${limit === 0 ? 'Unlimited' : limit}**!`)] });
      }

      if (sub === 'kick') {
        const target = message.mentions.members.first() || guild.members.cache.get(args[1]);
        if (!target) {
          return message.reply({ embeds: [KikiEmbed.error('User Missing', 'Usage: `&vm kick @member`')] });
        }
        if (!currentVc.members.has(target.id)) {
          return message.reply({ embeds: [KikiEmbed.error('Not in VC', 'Wo member aapke voice channel me nahi hai!')] });
        }
        await target.voice.disconnect();

        VoiceMaster.sendLog(guild, KikiEmbed.build({
          title: '🚫 Member Kicked from Voice Channel',
          description:
            `Ek user ko temporary voice channel se disconnect kiya gaya.\n\n` +
            `• 👤 **Kicked By Owner:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• 👢 **Target Member:** ${target.user.toString()} (\`${target.user.tag}\` • ID: \`${target.id}\`)\n` +
            `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
            `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: config.COLORS.GOLD || 0xE67E22,
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        }));

        return message.reply({ embeds: [KikiEmbed.success('Kicked 🚫', `**${target.user.tag}** ko voice channel se kick kar diya gaya!`)] });
      }

      if (sub === 'permit') {
        const target = message.mentions.members.first() || guild.members.cache.get(args[1]);
        if (!target) {
          return message.reply({ embeds: [KikiEmbed.error('User Missing', 'Usage: `&vm permit @member`')] });
        }
        await currentVc.permissionOverwrites.edit(target.id, { ViewChannel: true, Connect: true, Speak: true });

        VoiceMaster.sendLog(guild, KikiEmbed.build({
          title: '🤝 Member Permitted to Voice Channel',
          description:
            `Ek user ko locked channel me aane ki permission di gayi.\n\n` +
            `• 👤 **Permitted By:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• 🔓 **Permitted Member:** ${target.user.toString()} (\`${target.user.tag}\` • ID: \`${target.id}\`)\n` +
            `• 🔊 **Channel:** ${currentVc.toString()} (\`${currentVc.name}\`)\n` +
            `• ⏰ **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: config.COLORS.GREEN || 0x2ECC71,
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        }));

        return message.reply({ embeds: [KikiEmbed.success('Permitted 🤝', `**${target.user.tag}** ko aapke channel me aane ki permission de di gayi hai!`)] });
      }

      if (sub === 'delete') {
        const info = tempChannels.get(currentVc.id);
        const durationMs = info?.createdAt ? Date.now() - info.createdAt : 0;
        const durationStr = KIKI.formatDuration(Math.floor(durationMs / 1000));
        const chName = currentVc.name;

        VoiceMaster.removeTempChannel(currentVc.id);
        await currentVc.delete('Voice Master: Deleted by owner');

        VoiceMaster.sendLog(guild, KikiEmbed.build({
          title: '🗑️ Temporary Voice Channel Deleted',
          description:
            `Voice channel owner ne apna channel manually delete kar diya.\n\n` +
            `• 🔊 **Channel:** \`#${chName}\`\n` +
            `• 👤 **Deleted By Owner:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
            `• ⏱️ **Total Active Duration:** \`${durationStr || '0s'}\`\n` +
            `• ⏰ **Deleted At:** <t:${Math.floor(Date.now() / 1000)}:F>`,
          color: config.COLORS.RED || 0xE74C3C,
          footer: { text: `Voice Master Audit Logs • KIKI v${config.BOT_VERSION}` }
        }));

        return message.reply({ embeds: [KikiEmbed.success('Deleted 🗑️', 'Aapka temporary voice channel delete kar diya gaya!')] });
      }
    }

    // Admin Commands: setup, panel, reset
    if (!KIKI.isSafe(guild, message.author.id, client)) {
      return message.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf **Server Owner** ya **Whitelisted members** Voice Master setup ko modify kar sakte hain!')]
      });
    }

    if (sub === 'setup') {
      const botMember = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
      if (!botMember || !botMember.permissions.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers])) {
        return message.reply({
          embeds: [KikiEmbed.error('Permissions Missing ⚠️', 'KIKI ke paas **Manage Channels** aur **Move Members** permissions honi chahiye!')]
        });
      }

      const cfg = KIKI.loadConfig();

      let category = cfg.voice_master_category_id ? guild.channels.cache.get(cfg.voice_master_category_id) : null;
      if (!category) {
        category = await guild.channels.create({
          name: '🔊〢Voice Master',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [{ id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] }],
          reason: 'Voice Master: Category setup'
        });
      }

      let interfaceChannel = cfg.voice_master_interface_id ? guild.channels.cache.get(cfg.voice_master_interface_id) : null;
      if (!interfaceChannel) {
        interfaceChannel = await guild.channels.create({
          name: '🔊〢voice-control',
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages]
            },
            {
              id: botMember.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
            }
          ],
          reason: 'Voice Master: Interface channel'
        });
      }

      let joinChannel = cfg.voice_master_channel_id ? guild.channels.cache.get(cfg.voice_master_channel_id) : null;
      if (!joinChannel) {
        joinChannel = await guild.channels.create({
          name: '➕〢Join to Create',
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [
            { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] }
          ],
          reason: 'Voice Master: Join to Create channel'
        });
      }

      let logChannel = cfg.voice_master_log_channel_id ? guild.channels.cache.get(cfg.voice_master_log_channel_id) : null;
      if (!logChannel) {
        logChannel = guild.channels.cache.find(c => c.parentId === category.id && (c.name.includes('vm-logs') || c.name.includes('voice-master-logs')));
        if (!logChannel) {
          logChannel = await guild.channels.create({
            name: '🔊〢vm-logs',
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
              {
                id: guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages]
              },
              {
                id: botMember.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
              }
            ],
            reason: 'Voice Master: Dedicated audit logs channel'
          });
        }
      }

      const panelMessage = await interfaceChannel.send({
        embeds: [VoiceMaster.buildPanelEmbed()],
        components: VoiceMaster.buildPanelComponents()
      });

      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
      cfg.guilds[guild.id].voice_master_enabled = true;
      cfg.guilds[guild.id].voice_master_category_id = category.id;
      cfg.guilds[guild.id].voice_master_channel_id = joinChannel.id;
      cfg.guilds[guild.id].voice_master_interface_id = interfaceChannel.id;
      cfg.guilds[guild.id].voice_master_panel_message_id = panelMessage.id;
      cfg.guilds[guild.id].voice_master_log_channel_id = logChannel ? logChannel.id : null;
      if (!cfg.voice_master_channel_id) {
        cfg.voice_master_enabled = true;
        cfg.voice_master_category_id = category.id;
        cfg.voice_master_channel_id = joinChannel.id;
        cfg.voice_master_interface_id = interfaceChannel.id;
        cfg.voice_master_panel_message_id = panelMessage.id;
        cfg.voice_master_log_channel_id = logChannel ? logChannel.id : null;
      }
      KIKI.saveConfig(cfg);

      const successEmbed = KikiEmbed.build({
        title: '✅ Voice Master Setup Complete!',
        description:
          `Voice Master system successfully configure aur deploy ho gaya hai!\n\n` +
          `• 📁 **Category:** \`${category.name}\`\n` +
          `• ➕ **Join Channel:** ${joinChannel.toString()} (\`${joinChannel.name}\`)\n` +
          `• 🎛️ **Control Interface:** ${interfaceChannel.toString()}\n` +
          (logChannel ? `• 📜 **Audit Logs Channel:** ${logChannel.toString()}\n\n` : '\n') +
          `**⚡ Features Ready:**\n` +
          `• Automatic temporary channels per user\n` +
          `• Dedicated audit logs channel (Kisne VC banaya, kisne delete/rename kiya)\n` +
          `• Interactive control panel with buttons & modals\n` +
          `• Automatic channel deletion when empty`,
        color: config.COLORS.GREEN || 0x2ECC71,
        footer: { text: `Voice Master System • KIKI v${config.BOT_VERSION}` }
      });

      return message.reply({ embeds: [successEmbed] });
    }

    if (sub === 'setlog' || sub === 'log' || sub === 'logchannel') {
      const channel = message.mentions.channels.first() || guild.channels.cache.get(args[1]);
      if (!channel || channel.type !== ChannelType.GuildText) {
        return message.reply({
          embeds: [KikiEmbed.error('Invalid Channel ⚠️', 'Usage: `&vm setlog #channel` (ek valid text channel mention karein)')]
        });
      }

      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
      cfg.guilds[guild.id].voice_master_log_channel_id = channel.id;
      if (!cfg.voice_master_log_channel_id) cfg.voice_master_log_channel_id = channel.id;
      KIKI.saveConfig(cfg);

      return message.reply({
        embeds: [KikiEmbed.success('Audit Log Channel Set 📜', `Voice Master audit logs ab ${channel.toString()} me record honge!`)]
      });
    }

    if (sub === 'createlog') {
      const logChannel = await VoiceMaster.ensureLogChannel(guild);
      return message.reply({
        embeds: [KikiEmbed.success('Log Channel Ready 📜', `Voice Master audit logs channel: ${logChannel.toString()}`)]
      });
    }

    if (sub === 'panel') {
      const cfg = KIKI.loadConfig();
      const gData = cfg.guilds?.[guild.id] || {};
      const interfaceId = gData.voice_master_interface_id || (guild.channels.cache.has(cfg.voice_master_interface_id) ? cfg.voice_master_interface_id : null);
      const target = (interfaceId ? guild.channels.cache.get(interfaceId) : null) || message.channel;
      await target.send({
        embeds: [VoiceMaster.buildPanelEmbed()],
        components: VoiceMaster.buildPanelComponents()
      });
      return message.reply({ embeds: [KikiEmbed.success('Panel Sent', `Control Panel ${target.toString()} me bhej diya gaya hai!`)] });
    }

    if (sub === 'reset') {
      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
      cfg.guilds[guild.id].voice_master_enabled = false;
      cfg.guilds[guild.id].voice_master_channel_id = null;
      cfg.guilds[guild.id].voice_master_interface_id = null;
      cfg.guilds[guild.id].voice_master_category_id = null;
      cfg.guilds[guild.id].voice_master_log_channel_id = null;
      KIKI.saveConfig(cfg);
      return message.reply({ embeds: [KikiEmbed.warn('Voice Master Reset', 'Configuration reset aur disable ho gaya.')] });
    }

    // Default help display
    const helpEmbed = KikiEmbed.purple(
      '🔊 KIKI • Voice Master Guide',
      `**Setup Command (Admin):**\n` +
      `• \`&voicemaster setup\` or \`/voicemaster setup\` — Automatically create Voice Master category, join-to-create VC, and control panel.\n` +
      `• \`&voicemaster panel\` — Resend the control panel.\n` +
      `• \`&voicemaster reset\` — Reset configuration.\n\n` +
      `**User VC Controls (While inside your temp VC):**\n` +
      `• \`&vm lock\` / \`&vm unlock\` — Lock or unlock your channel\n` +
      `• \`&vm hide\` / \`&vm unhide\` — Hide or unhide your channel\n` +
      `• \`&vm rename <name>\` — Rename your voice channel\n` +
      `• \`&vm limit <0-99>\` — Set user limit\n` +
      `• \`&vm kick @user\` — Disconnect a member from your channel\n` +
      `• \`&vm permit @user\` — Allow a member to join\n` +
      `• \`&vm claim\` — Claim ownership if the owner left\n` +
      `• \`&vm delete\` — Delete your voice channel`
    );
    return message.reply({ embeds: [helpEmbed] });
  }
};
