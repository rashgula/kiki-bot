const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crime-heist-attempt')
    .setDescription('🗡️ Attempt a dark heist in the shadows'),

  aliases: ['crime', 'heist', 'robbery'],
  name: 'crime-heist-attempt',

  async execute(interaction, client) {
    const res = Economy.crime(interaction.guildId, interaction.user.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return interaction.reply({ embeds: [KikiEmbed.error('Cooldown ⏳', `Aap thak gaye hain! Agle heist ke liye **${wait}** intezar karein.`)] });
    }
    const embed = res.success
      ? KikiEmbed.success('Heist Successful! 🗡️', `${res.message}\n\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``)
      : KikiEmbed.error('Caught by Coven Guards! 🚨', `${res.message}\n\n**Remaining Wallet:** \`${res.balance.toLocaleString()} Coins\``);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const res = Economy.crime(message.guild.id, message.author.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return message.reply({ embeds: [KikiEmbed.error('Cooldown ⏳', `Aap thak gaye hain! Agle heist ke liye **${wait}** intezar karein.`)] });
    }
    const embed = res.success
      ? KikiEmbed.success('Heist Successful! 🗡️', `${res.message}\n\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``)
      : KikiEmbed.error('Caught by Coven Guards! 🚨', `${res.message}\n\n**Remaining Wallet:** \`${res.balance.toLocaleString()} Coins\``);
    message.reply({ embeds: [embed] });
  }
};
