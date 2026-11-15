// KIKI Bot - NUKE Command (Channel Clone & Clean)
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('💥 Channel ko nuke karo (clone & clean) | Owner/Admin only')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [KikiEmbed.error('No Permission', 'Tumhare paas `Manage Channels` permission nahi hai!')], ephemeral: true });
    }

    const confirmBtn = new ButtonBuilder().setCustomId('confirm_nuke').setLabel('💥 NUKE IT').setStyle(ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId('cancel_nuke').setLabel('❌ Cancel').setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

    const confirmEmbed = KikiEmbed.warn('Confirm Nuke', `Kya aap sach mein **${interaction.channel.name}** ko nuke karna chahte ho?\n\nSaare messages delete ho jayenge!`);

    await interaction.reply({ embeds: [confirmEmbed], components: [row] });
  },

  async handleConfirm(interaction, client) {
    const channel = interaction.channel;
    const pos = channel.position;

    try {
      const newChannel = await channel.clone({ reason: `[KIKI] Channel nuked by ${interaction.user.tag}` });
      await channel.delete('Channel nuked');
      await newChannel.setPosition(pos);

      const nukeEmbed = KikiEmbed.nuke('Channel Nuked! 💥', `This channel was nuked by **${interaction.user.tag}**.\n\nAll messages have been obliterated! 🔮`)
        .setImage('https://media.giphy.com/media/oe33xf3B50fsc/giphy.gif');

      await newChannel.send({ embeds: [nukeEmbed] });
    } catch (err) {
      console.error('[NUKE]', err);
    }
  },

  // Prefix command support
  name: 'nuke',
  aliases: ['channelnuke'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'Manage Channels permission chahiye!')] });
    }
    const pos = message.channel.position;
    const newChannel = await message.channel.clone({ reason: `Nuked by ${message.author.tag}` });
    await message.channel.delete();
    await newChannel.setPosition(pos);
    const embed = KikiEmbed.nuke('Channel Nuked! 💥', `${message.author.tag} ne ye channel nuke kar diya!`)
      .setImage('https://media.giphy.com/media/oe33xf3B50fsc/giphy.gif');
    await newChannel.send({ embeds: [embed] });
  },
};
