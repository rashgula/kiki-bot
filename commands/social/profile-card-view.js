const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Social = require('../../utils/social.js');
const Leveling = require('../../utils/leveling.js');
const Economy = require('../../utils/economy.js');
const FunEngine = require('../../utils/funEngine.js');

function buildProfileEmbed(guildId, user) {
  const prof = Social.getProfile(guildId, user.id);
  const lvl = Leveling.getUser(guildId, user.id);
  const bal = Economy.getBalance(guildId, user.id);
  const mar = FunEngine.getMarriage(guildId, user.id);

  return KikiEmbed.build({
    title: `👤 ${user.username} • ${prof.title}`,
    description:
      `> *${prof.bio}*\n\n` +
      `⭐ **Reputation:** \`${prof.rep || 0}\` | 💍 **Partner:** ${mar?.partnerId ? `<@${mar.partnerId}>` : '`Single`'}\n` +
      `🎙️ **VC Level:** \`Lv.${lvl.level}\` (${lvl.xp.toLocaleString()} XP) | 💬 **Chat:** \`Lv.${lvl.chatLevel}\`\n` +
      `🪙 **Net Worth:** \`${bal.netWorth.toLocaleString()} Coins\`\n` +
      (prof.birthday ? `🎂 **Birthday:** \`${String(prof.birthday.day).padStart(2, '0')}/${String(prof.birthday.month).padStart(2, '0')}\`\n` : '') +
      `\n*Customize: \`&setbio\`, \`&settitle\`, \`&setcolor\`, \`&setbday\`*`,
    color: prof.color || 0x9B59B6,
    thumbnail: user.displayAvatarURL({ dynamic: true })
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile-card-view')
    .setDescription('👤 View gothic profile card with levels, economy, rep and marriage')
    .addUserOption(o => o.setName('user').setDescription('Member profile')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    await interaction.reply({ embeds: [buildProfileEmbed(interaction.guildId, target)] });
  },

  name: 'profile-card-view',
  aliases: ['k-profile-card-view', 'profilecardview', 'profile'],
  async run(message, args, client) {
    const cleanId = args[0]?.replace(/[<@!>]/g, '');
    const target = message.mentions?.users?.first?.()
      || (cleanId && /^\d{17,20}$/.test(cleanId) ? await client.users.fetch(cleanId).catch(() => null) : null)
      || message.author;
    message.reply({ embeds: [buildProfileEmbed(message.guild.id, target)] });
  }
};
