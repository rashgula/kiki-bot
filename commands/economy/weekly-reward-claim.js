const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weekly-reward-claim')
    .setDescription('📅 Claim weekly loyalty coin allowance'),

  aliases: ['weekly', 'claimweekly'],
  name: 'weekly-reward-claim',

  async execute(interaction, client) {
    const res = Economy.claimWeekly(interaction.guildId, interaction.user.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return interaction.reply({ embeds: [KikiEmbed.error('Weekly Cooldown ⏳', `Aap apna weekly reward claim kar chuke hain!\nNext claim in: **${wait}**`)] });
    }
    const embed = KikiEmbed.success('Weekly Reward Claimed! 📅',
      `${res.message}\n\n**New Wallet:** \`${res.wallet.toLocaleString()} Coins\``
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const res = Economy.claimWeekly(message.guild.id, message.author.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return message.reply({ embeds: [KikiEmbed.error('Weekly Cooldown ⏳', `Aap apna weekly reward claim kar chuke hain!\nNext claim in: **${wait}**`)] });
    }
    const embed = KikiEmbed.success('Weekly Reward Claimed! 📅',
      `${res.message}\n\n**New Wallet:** \`${res.wallet.toLocaleString()} Coins\``
    );
    message.reply({ embeds: [embed] });
  }
};
