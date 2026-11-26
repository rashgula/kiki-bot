const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hunt-forest-game')
    .setDescription('🏹 Hunt shadow beasts in the misty gothic woods'),

  aliases: ['hunt', 'hunting'],
  name: 'hunt-forest-game',

  async execute(interaction, client) {
    const res = Economy.hunt(interaction.guildId, interaction.user.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return interaction.reply({ embeds: [KikiEmbed.error('Cooldown ⏳', `Shikar se thak gaye hain! Wait: **${wait}**`)] });
    }
    const embed = KikiEmbed.purple('Misty Woods Hunt 🏹',
      `${res.message}\n\n**Reward:** \`+${res.payout} Coins\`\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const res = Economy.hunt(message.guild.id, message.author.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return message.reply({ embeds: [KikiEmbed.error('Cooldown ⏳', `Shikar se thak gaye hain! Wait: **${wait}**`)] });
    }
    const embed = KikiEmbed.purple('Misty Woods Hunt 🏹',
      `${res.message}\n\n**Reward:** \`+${res.payout} Coins\`\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``
    );
    message.reply({ embeds: [embed] });
  }
};
