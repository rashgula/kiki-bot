const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('marriage-status-view')
    .setDescription('💒 View marriage partner and anniversary')
    .addUserOption(o => o.setName('user').setDescription('Target user to check')),

  name: 'marriage-status-view',
  aliases: ['k-marriage-status-view', 'marriagestatusview', 'marriage', 'partner'],

  async execute(interaction, client) {
    const target = interaction.options.getUser('user') || interaction.user;
    const marriage = FunEngine.getMarriage(interaction.guildId, target.id);
    let desc = '';
    if (marriage && marriage.partnerId) {
      const timeSec = Math.floor(marriage.date / 1000);
      desc = `💍 **Partner:** <@${marriage.partnerId}>\n` +
        `📅 **Married Since:** <t:${timeSec}:F> (<t:${timeSec}:R>)\n\n` +
        `*Covenant status: Eternal Dark Love 🖤*`;
    } else {
      desc = `💔 **Status:** Single (No active covenant)\n\n` +
        `💡 *Propose to someone with \`&marry @user\`!*`;
    }
    const embed = KikiEmbed.purple(`💒 Gothic Marriage: ${target.username}`, desc);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const target = message.mentions?.users?.first?.() ||
      (args && args[0] ? message.guild?.members.cache.find(m => m.id === args[0].replace(/[<@!>]/g, '') || m.user.username.toLowerCase() === args[0].toLowerCase())?.user : null) ||
      message.author;

    const marriage = FunEngine.getMarriage(message.guild.id, target.id);
    let desc = '';
    if (marriage && marriage.partnerId) {
      const timeSec = Math.floor(marriage.date / 1000);
      desc = `💍 **Partner:** <@${marriage.partnerId}>\n` +
        `📅 **Married Since:** <t:${timeSec}:F> (<t:${timeSec}:R>)\n\n` +
        `*Covenant status: Eternal Dark Love 🖤*`;
    } else {
      desc = `💔 **Status:** Single (No active covenant)\n\n` +
        `💡 *Propose to someone with \`&marry @user\`!*`;
    }
    const embed = KikiEmbed.purple(`💒 Gothic Marriage: ${target.username}`, desc);
    message.reply({ embeds: [embed] });
  }
};
