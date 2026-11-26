const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder().setName('prefix').setDescription('⚙️ Change server command prefix')
    .addStringOption(o => o.setName('new_prefix').setDescription('New prefix string'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, interaction.client) && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [KikiEmbed.error('Access Denied', 'Sirf Administrators prefix change kar sakte hain!')], ephemeral: true });
    }
    const p = interaction.options.getString('new_prefix');
    const current = KIKI.getGuildConfig(interaction.guild.id, 'prefix', config.PREFIX);
    if (!p) {
      return interaction.reply({ embeds: [KikiEmbed.purple('Current Prefix', `Prefix for this server is: \`${current}\``)] });
    }
    if (p.length > 5) {
      return interaction.reply({ embeds: [KikiEmbed.error('Invalid Prefix', 'Prefix 5 characters se chota hona chahiye!')], ephemeral: true });
    }
    KIKI.setGuildConfig(interaction.guild.id, 'prefix', p);
    await interaction.reply({ embeds: [KikiEmbed.success('Prefix Updated', `Server prefix set to: \`${p}\``)] });
  },
  name: 'prefix', aliases: ['setprefix'],
  async run(message, args, client) {
    const current = KIKI.getGuildConfig(message.guild.id, 'prefix', config.PREFIX);
    const p = args[0];
    if (!p) return message.reply({ embeds: [KikiEmbed.purple('Prefix', `Current prefix for **${message.guild.name}**: \`${current}\``)] });
    if (!KIKI.isSafe(message.guild, message.author.id, client) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ embeds: [KikiEmbed.error('Access Denied', 'Aapke paas **Administrator** permission honi chahiye!')] });
    }
    if (p.length > 5) {
      return message.reply({ embeds: [KikiEmbed.error('Invalid Prefix', 'Prefix 5 characters se chota hona chahiye!')] });
    }
    KIKI.setGuildConfig(message.guild.id, 'prefix', p);
    message.reply({ embeds: [KikiEmbed.success('Prefix Updated', `New prefix for **${message.guild.name}**: \`${p}\``)] });
  }
};
