const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder().setName('setticketcategory').setDescription('🎫 Set Category for newly created tickets')
    .addChannelOption(o => o.setName('category').setDescription('Category').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, interaction.client) && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [KikiEmbed.error('Access Denied', 'Administrator permission chahiye!')], ephemeral: true });
    }
    const cat = interaction.options.getChannel('category');
    KIKI.setGuildConfig(interaction.guild.id, 'ticket_category_id', cat.id);
    await interaction.reply({ embeds: [KikiEmbed.success('Ticket Category Set', `✅ New tickets will be opened under **${cat.name}**`)] });
  },
  name: 'setticketcategory', aliases: [],
  async run(message, args, client) {
    if (!KIKI.isSafe(message.guild, message.author.id, client) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ embeds: [KikiEmbed.error('Access Denied', 'Aapke paas Administrator permission honi chahiye!')] });
    }
    const id = args[0]?.replace(/[<#>]/g, '');
    if (!id) return message.reply({ embeds: [KikiEmbed.warn('Usage', '`&setticketcategory <categoryId>`')] });
    KIKI.setGuildConfig(message.guild.id, 'ticket_category_id', id);
    message.reply({ embeds: [KikiEmbed.success('Ticket Category', `Set to \`${id}\``)] });
  }
};
