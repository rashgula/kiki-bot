
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder().setName('anti-raid-mode').setDescription('🛡️ Anti-raid mode toggle karo')
    .addStringOption(o => o.setName('mode').setDescription('on/off').setRequired(true).addChoices({ name: 'ON', value: 'on' }, { name: 'OFF', value: 'off' }))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    if (!KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id) && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [KikiEmbed.error('Access Denied', 'Sirf Server Owner ya Administrators anti-raid mode toggle kar sakte hain!')], ephemeral: true });
    }
    const mode = interaction.options.getString('mode') === 'on';
    KIKI.setGuildConfig(interaction.guild.id, 'anti_raid', mode);
    await interaction.reply({ embeds: [mode ? KikiEmbed.success('Anti-Raid ON', '🛡️ Anti-raid mode enabled! Non-whitelisted new joins will be auto-kicked.') : KikiEmbed.warn('Anti-Raid OFF', 'Anti-raid mode disabled.')] });
  },
  name: 'anti-raid-mode',
  aliases: ['raidmode', 'antiraid'],
  async run(message, args, client) {
    if (!KIKI.isServerOrBotOwner(message.guild, message.author.id) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ embeds: [KikiEmbed.error('Access Denied', 'Sirf Administrators anti-raid mode toggle kar sakte hain!')] });
    }
    const arg = (args[0] || '').toLowerCase();
    const current = KIKI.getGuildConfig(message.guild.id, 'anti_raid', false);
    const nextMode = arg === 'on' || arg === 'enable' ? true : (arg === 'off' || arg === 'disable' ? false : !current);
    KIKI.setGuildConfig(message.guild.id, 'anti_raid', nextMode);
    message.reply({ embeds: [nextMode ? KikiEmbed.success('Anti-Raid Mode ON 🛡️', 'Server ab Anti-Raid Lockdown me hai! Naye joins auto-kick honge.') : KikiEmbed.warn('Anti-Raid Mode OFF', 'Anti-Raid Lockdown band kar diya gaya hai.')] });
  }
};
