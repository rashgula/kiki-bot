const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work-job-shift')
    .setDescription('💼 Work a shift in the gothic underground realm'),

  aliases: ['work', 'job', 'shift'],
  name: 'work-job-shift',

  async execute(interaction, client) {
    const res = Economy.work(interaction.guildId, interaction.user.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return interaction.reply({ embeds: [KikiEmbed.error('Work Cooldown ⏳', `Aap thak chuke hain! Agle shift ke liye **${wait}** aaram karein.`)] });
    }
    const embed = KikiEmbed.success(res.job,
      `${res.desc}\n\n**Earned:** \`+${res.amount.toLocaleString()} Gothic Coins\`\n**New Wallet:** \`${res.wallet.toLocaleString()} Coins\\`
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const res = Economy.work(message.guild.id, message.author.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return message.reply({ embeds: [KikiEmbed.error('Work Cooldown ⏳', `Aap thak chuke hain! Agle shift ke liye **${wait}** aaram karein.`)] });
    }
    const embed = KikiEmbed.success(res.job,
      `${res.desc}\n\n**Earned:** \`+${res.amount.toLocaleString()} Gothic Coins\`\n**New Wallet:** \`${res.wallet.toLocaleString()} Coins\\`
    );
    message.reply({ embeds: [embed] });
  }
};
