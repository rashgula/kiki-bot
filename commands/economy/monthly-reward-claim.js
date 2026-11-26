const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('monthly-reward-claim')
    .setDescription('🏆 Claim monthly elite coin jackpot'),

  aliases: ['monthly', 'claimmonthly'],
  name: 'monthly-reward-claim',

  async execute(interaction, client) {
    const res = Economy.claimMonthly(interaction.guildId, interaction.user.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return interaction.reply({ embeds: [KikiEmbed.error('Monthly Cooldown ⏳', `Aap apna monthly jackpot claim kar chuke hain!\nNext claim in: **${wait}**`)] });
    }
    const embed = KikiEmbed.success('Monthly Jackpot Claimed! 🏆',
      `${res.message}\n\n**New Wallet:** \`${res.wallet.toLocaleString()} Coins\``
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const res = Economy.claimMonthly(message.guild.id, message.author.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return message.reply({ embeds: [KikiEmbed.error('Monthly Cooldown ⏳', `Aap apna monthly jackpot claim kar chuke hain!\nNext claim in: **${wait}**`)] });
    }
    const embed = KikiEmbed.success('Monthly Jackpot Claimed! 🏆',
      `${res.message}\n\n**New Wallet:** \`${res.wallet.toLocaleString()} Coins\``
    );
    message.reply({ embeds: [embed] });
  }
};
