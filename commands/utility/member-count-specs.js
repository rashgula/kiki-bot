const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

function buildCountEmbed(guild) {
  const total = guild.memberCount;
  const cached = guild.members.cache;
  const bots = cached.filter(m => m.user.bot).size;
  const humans = Math.max(0, total - bots);
  return KikiEmbed.purple(`👥 Member Count • ${guild.name}`,
    `• **Total Members:** \`${total.toLocaleString()}\`\n` +
    `• **Humans (est.):** \`${humans.toLocaleString()}\`\n` +
    `• **Cached Bots:** \`${bots.toLocaleString()}\`\n` +
    `• **Boosters:** \`${guild.premiumSubscriptionCount || 0}\``
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('member-count-specs')
    .setDescription('👥 View human, bot, booster and total member breakdown'),

  aliases: ['k-member-count-specs', 'membercountspecs'],
  name: 'member-count-specs',

  async execute(interaction) {
    await interaction.reply({ embeds: [buildCountEmbed(interaction.guild)] });
  },

  async run(message) {
    message.reply({ embeds: [buildCountEmbed(message.guild)] });
  }
};
