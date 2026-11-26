const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

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
    const guild = interaction.guild;
    const staffRoleId = KIKI.getGuildConfig(guild.id, 'staff_role_id');
    const ticketCategoryId = KIKI.getGuildConfig(guild.id, 'ticket_category_id');
    const channelName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '') || interaction.user.id.slice(-4)}`;

    const existing = guild.channels.cache.find(c => c.name === channelName);
    if (existing) {
      return interaction.reply({ content: `❌ Aapka ticket pehle se open hai: ${existing.toString()}`, ephemeral: true });
    }

    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
      { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
    ];

    if (staffRoleId && guild.roles.cache.has(staffRoleId)) {
      overwrites.push({ id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
    }

    const validCategory = ticketCategoryId && guild.channels.cache.has(ticketCategoryId) ? ticketCategoryId : null;
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: validCategory,
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
