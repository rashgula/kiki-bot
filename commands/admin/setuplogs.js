const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const config = require('../../config.js');

async function createOrFindCategory(guild, name) {
  let category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && (
      c.name.toLowerCase() === name.toLowerCase() ||
      c.name.toLowerCase().includes('server logs') ||
      c.name.toLowerCase().includes('kiki logs')
    )
  );

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.SendMessages]
        },
        {
          id: guild.members.me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ],
      reason: '[KIKI] Auto Logs Category Setup'
    });
  }
  return category;
}

async function createOrFindTextChannel(guild, categoryId, name, topic, isPublicView = false) {
  const cleanName = name.replace(/^[^\w\d-]+/, '').toLowerCase();
  let channel = guild.channels.cache.find(
    c => c.parentId === categoryId && (
      c.name.toLowerCase() === name.toLowerCase() ||
      c.name.toLowerCase().includes(cleanName)
    )
  );

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: isPublicView ? [PermissionFlagsBits.SendMessages] : [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      allow: isPublicView ? [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] : []
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels
      ]
    }
  ];

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: categoryId,
      topic,
      permissionOverwrites: overwrites,
      reason: '[KIKI] Auto Log Channel Setup'
    });
  } else {
    if (channel.parentId !== categoryId) {
      await channel.setParent(categoryId).catch(() => {});
    }
    await channel.permissionOverwrites.set(overwrites).catch(() => {});
  }

  return channel;
}

async function executeSetup(guild, userMember, client) {
  // 1. Permission checks
  if (!userMember.permissions.has(PermissionFlagsBits.Administrator) && !KIKI.isSafe(guild, userMember.id, client)) {
    throw new Error('Aapke paas **Administrator** permission honi chahiye!');
  }

  const botMember = guild.members.me;
  if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
    throw new Error('Bot ke paas **Manage Channels** permission nahi hai! Please bot ko proper permissions dein.');
  }

  // 2. Create or find Category
  const category = await createOrFindCategory(guild, '🔮・SERVER LOGS');

  // 3. Create or find Channels
  const voiceChannel = await createOrFindTextChannel(
    guild,
    category.id,
    '🔊・voice-logs',
    'KIKI Voice Logs • VC Joins, Leaves, Moves & Audio Activity Records',
    false
  );

  const chatChannel = await createOrFindTextChannel(
    guild,
    category.id,
    '💬・chat-logs',
    'KIKI Chat Logs • Message Edits, Deletes & Chat Activity Records',
    false
  );

  const welcomeChannel = await createOrFindTextChannel(
    guild,
    category.id,
    '👋・welcome',
    'KIKI Welcome • Welcoming new members joining the server',
    true
  );

  const leaveChannel = await createOrFindTextChannel(
    guild,
    category.id,
    '🚪・leave-logs',
    'KIKI Leave Logs • Records of members leaving the server',
    false
  );

  const securityChannel = await createOrFindTextChannel(
    guild,
    category.id,
    '🛡️・security-logs',
    'KIKI Security Logs • Anti-Nuke, Rogue Bot Add & Server Protection Alerts',
    false
  );

  // 4. Save to config.json (Multi-Server Isolated per Guild)
  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
  cfg.guilds[guild.id].voice_log_channel_id = voiceChannel.id;
  cfg.guilds[guild.id].chat_log_channel_id = chatChannel.id;
  cfg.guilds[guild.id].welcome_channel_id = welcomeChannel.id;
  cfg.guilds[guild.id].leave_channel_id = leaveChannel.id;
  cfg.guilds[guild.id].log_channel_id = securityChannel.id;
  cfg.guilds[guild.id].security_log_channel_id = securityChannel.id;
  cfg.guilds[guild.id].logs_category_id = category.id;

  // Set top-level fallback only if unset
  if (!cfg.security_log_channel_id) {
    cfg.voice_log_channel_id = voiceChannel.id;
    cfg.chat_log_channel_id = chatChannel.id;
    cfg.welcome_channel_id = welcomeChannel.id;
    cfg.leave_channel_id = leaveChannel.id;
    cfg.log_channel_id = securityChannel.id;
    cfg.security_log_channel_id = securityChannel.id;
    cfg.logs_category_id = category.id;
  }
  KIKI.saveConfig(cfg);

  // 5. Send initial banner messages to created channels (if empty or on setup)
  const sendIntro = async (ch, title, desc, col) => {
    try {
      const messages = await ch.messages.fetch({ limit: 1 }).catch(() => null);
      if (!messages || messages.size === 0) {
        const embed = KikiEmbed.build({
          title,
          description: desc,
          color: col || config.COLORS.PRIMARY
        });
        await ch.send({ embeds: [embed] }).catch(() => {});
      }
    } catch {}
  };

  await sendIntro(
    welcomeChannel,
    '👋 Welcome Channel Ready!',
    'Jab bhi koi naya member server join karega, uska welcome greeting card yahan send hoga.',
    config.COLORS.PRIMARY
  );

  await sendIntro(
    leaveChannel,
    '🚪 Leave Logs Channel Ready!',
    'Jab bhi koi member server chhod kar jayega ya kick/ban hoga, uska record yahan aayega.',
    config.COLORS.RED
  );

  await sendIntro(
    voiceChannel,
    '🔊 Voice Logs Channel Ready!',
    'Voice channel join, leave, switch, aur mute/deafen status updates yahan log honge.',
    config.COLORS.GREEN
  );

  await sendIntro(
    chatChannel,
    '💬 Chat Logs Channel Ready!',
    'Messages ka delete aur edit hone ka record yahan aayega.',
    config.COLORS.GOLD
  );

  await sendIntro(
    securityChannel,
    '🛡️ Security Logs Channel Ready!',
    'Anti-Nuke alerts, rogue bot detections, aur unauthorized actions yahan log honge.',
    config.COLORS.DARK
  );

  // 6. Return response embed
  const responseEmbed = KikiEmbed.build({
    title: '🔮 Log Channels Setup Complete!',
    description:
      `Sabhi logs channels automatically create aur configure kar diye gaye hain!\n\n` +
      `📁 **Category:** <#${category.id}> (\`${category.name}\`)\n\n` +
      `• 🔊 **Voice Logs:** ${voiceChannel.toString()} — VC Join, Leave, Move, Mute\n` +
      `• 💬 **Chat Logs:** ${chatChannel.toString()} — Message Delete & Edit\n` +
      `• 👋 **Welcome:** ${welcomeChannel.toString()} — Naye members ke join hone par card\n` +
      `• 🚪 **Leave Logs:** ${leaveChannel.toString()} — Members ke leave hone par record\n` +
      `• 🛡️ **Security Logs:** ${securityChannel.toString()} — Anti-Nuke & Defense alerts\n\n` +
      `🔒 **Permissions:**\n` +
      `> • \`#welcome\` public hai (members dekh sakte hain, send blocked).\n` +
      `> • Voice, Chat, Leave aur Security logs private hain (Admins/Staff only).\n` +
      `> • Bot config file me saari channel IDs automatically bind ho chuki hain!`,
    color: config.COLORS.PRIMARY
  });

  return responseEmbed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setuplogs')
    .setDescription('⚡ Create all log channels automatically (Voice, Chat, Welcome, Leave, Security)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    await interaction.deferReply();
    try {
      const embed = await executeSetup(interaction.guild, interaction.member, client);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[SETUPLOGS ERROR]', err);
      await interaction.editReply({ embeds: [KikiEmbed.error('Setup Failed', err.message)] });
    }
  },

  name: 'setuplogs',
  aliases: ['setup-logs', 'logsetup', 'logs-setup', 'createlogs', 'createlogchannels'],
  async run(message, args, client) {
    const loadingMsg = await message.reply({
      embeds: [KikiEmbed.purple('⏳ Setting Up Channels...', 'Saare log channels create aur configure ho rahe hain, please wait...')]
    });

    try {
      const embed = await executeSetup(message.guild, message.member, client);
      await loadingMsg.edit({ embeds: [embed] });
    } catch (err) {
      console.error('[SETUPLOGS ERROR]', err);
      await loadingMsg.edit({ embeds: [KikiEmbed.error('Setup Failed', err.message)] });
    }
  }
};
