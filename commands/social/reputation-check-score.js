const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Social = require('../../utils/social.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reputation-check-score')
    .setDescription('⭐ Check reputation score and gothic title')
    .addUserOption(o => o.setName('user').setDescription('Member to check')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const prof = Social.getProfile(interaction.guildId, target.id);
    const embed = KikiEmbed.build({
      title: `⭐ Reputation • ${target.username}`,
      description: `**Reputation Score:** \`${prof.rep || 0} ⭐\`\n**Title:** ${prof.title}\n\n*Endorse helpful members with \`&rep @user\`!*`,
      color: prof.color || 0x9B59B6,
      thumbnail: target.displayAvatarURL({ dynamic: true })
    });
    await interaction.reply({ embeds: [embed] });
  },

  name: 'reputation-check-score',
  aliases: ['k-reputation-check-score', 'reputationcheckscore', 'checkrep'],
  async run(message, args, client) {
    const cleanId = args[0]?.replace(/[<@!>]/g, '');
    const target = message.mentions?.users?.first?.()
      || (cleanId && /^\d{17,20}$/.test(cleanId) ? await client.users.fetch(cleanId).catch(() => null) : null)
      || message.author;
    const prof = Social.getProfile(message.guild.id, target.id);
    const embed = KikiEmbed.build({
      title: `⭐ Reputation • ${target.username}`,
      description: `**Reputation Score:** \`${prof.rep || 0} ⭐\`\n**Title:** ${prof.title}\n\n*Endorse helpful members with \`&rep @user\`!*`,
      color: prof.color || 0x9B59B6,
      thumbnail: target.displayAvatarURL({ dynamic: true })
    });
    message.reply({ embeds: [embed] });
  }
};
