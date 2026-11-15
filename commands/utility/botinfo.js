const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const config = require('../../config.js');
module.exports = {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('🔮 KIKI Bot information and specifications'),
  async execute(interaction, client) {
    const embed = KikiEmbed.purple('「 KIKI 」• System Specs', config.BOT_TAGLINE)
      .addFields(
        { name: 'Version', value: `v${config.BOT_VERSION} JS Edition`, inline: true },
        { name: 'Library', value: 'Discord.js v14.15.3', inline: true },
        { name: 'Node.js', value: process.version, inline: true },
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Total Commands', value: `${client.totalCommands || '800+'}`, inline: true },
        { name: 'Theme', value: 'Gothic Purple (#9B59B6)', inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'botinfo', aliases: ['bi', 'stats', 'kikiinfo'],
  async run(message, args, client) {
    message.reply({ embeds: [KikiEmbed.purple('KIKI Specs', `Version: v${config.BOT_VERSION} | Node: ${process.version}`)] });
  }
};
