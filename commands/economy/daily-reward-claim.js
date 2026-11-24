const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily-reward-claim')
    .setDescription('🎁 Claim daily gothic coins gift'),

  aliases: ['daily', 'claimdaily'],
  name: 'daily-reward-claim',

  async execute(interaction, client) {
    const res = Economy.claimDaily(interaction.guildId, interaction.user.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return interaction.reply({ embeds: [KikiEmbed.error('Daily Cooldown ⏳', `Aap pehle hi daily reward le chuke hain!\nAgla reward claim karne ke liye **${wait}** intezar karein.`)] });
    }
    const embed = KikiEmbed.success('Daily Reward Claimed! 🎁',
      `Aapko **+${res.amount.toLocaleString()} Gothic Coins** mile!\n🔥 **Daily Streak:** \`${res.streak} days\`\n💰 **New Wallet:** \`${res.wallet.toLocaleString()} Coins\\`
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const res = Economy.claimDaily(message.guild.id, message.author.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return message.reply({ embeds: [KikiEmbed.error('Daily Cooldown ⏳', `Aap pehle hi daily reward le chuke hain!\nAgla reward claim karne ke liye **${wait}** intezar karein.`)] });
    }
    const embed = KikiEmbed.success('Daily Reward Claimed! 🎁',
      `Aapko **+${res.amount.toLocaleString()} Gothic Coins** mile!\n🔥 **Daily Streak:** \`${res.streak} days\`\n💰 **New Wallet:** \`${res.wallet.toLocaleString()} Coins\\`
    );
    message.reply({ embeds: [embed] });
  }
};
