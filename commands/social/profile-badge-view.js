const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Social = require('../../utils/social.js');
const Leveling = require('../../utils/leveling.js');
const Economy = require('../../utils/economy.js');
const FunEngine = require('../../utils/funEngine.js');
const KIKI = require('../../utils/kiki.js');

function computeBadges(guild, userId, client) {
  const lvl = Leveling.getUser(guild.id, userId);
  const bal = Economy.getBalance(guild.id, userId);
  const prof = Social.getProfile(guild.id, userId);
  const mar = FunEngine.getMarriage(guild.id, userId);
  const badges = [];
  if (guild.ownerId === userId || KIKI.isOwner(userId)) badges.push('👑 **Sovereign** *(Owner)*');
  if (KIKI.isSafe(guild, userId, client)) badges.push('🛡️ **Coven Guardian** *(Whitelisted)*');
  if (lvl.level >= 25) badges.push('🎙️ **Voice Legend** *(VC Lv.25+)*');
  else if (lvl.level >= 10) badges.push('🔊 **Voice Regular** *(VC Lv.10+)*');
  if (lvl.chatLevel >= 10) badges.push('💬 **Chatterbox** *(Chat Lv.10+)*');
  if (bal.netWorth >= 50000) badges.push('💎 **Shadow Magnate** *(50k+ Coins)*');
  if ((prof.rep || 0) >= 5) badges.push('⭐ **Respected Soul** *(5+ Rep)*');
  if (mar?.partnerId) badges.push('💍 **Bound Heart** *(Married)*');
  return badges;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile-badge-view')
    .setDescription('🎖️ View achievement badges unlocked on your account')
    .addUserOption(o => o.setName('user').setDescription('Target user')),

  async execute(interaction, client) {
    const target = interaction.options.getUser('user') || interaction.user;
    const badges = computeBadges(interaction.guild, target.id, client);
    const desc = badges.length ? badges.join('\n') : 'Abhi koi special badge unlock nahi hua! VC join karein, chat karein, aur economy khele!';
    await interaction.reply({ embeds: [KikiEmbed.purple(`🎖️ Badges • ${target.username}`, desc)] });
  },

  name: 'profile-badge-view',
  aliases: ['k-profile-badge-view', 'profilebadgeview', 'badges'],
  async run(message, args, client) {
    const cleanId = args[0]?.replace(/[<@!>]/g, '');
    const target = message.mentions?.users?.first?.()
      || (cleanId && /^\d{17,20}$/.test(cleanId) ? await client.users.fetch(cleanId).catch(() => null) : null)
      || message.author;
    const badges = computeBadges(message.guild, target.id, client);
    const desc = badges.length ? badges.join('\n') : 'Abhi koi special badge unlock nahi hua! VC join karein, chat karein, aur economy khele!';
    message.reply({ embeds: [KikiEmbed.purple(`🎖️ Badges • ${target.username}`, desc)] });
  }
};
