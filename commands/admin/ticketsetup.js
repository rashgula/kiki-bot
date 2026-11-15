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
