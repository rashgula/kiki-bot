const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fish-catch-lake')
    .setDescription('🎣 Cast fishing line into the obsidian lake'),

  aliases: ['fish', 'fishing'],
  name: 'fish-catch-lake',

  async execute(interaction, client) {
    const res = Economy.fish(interaction.guildId, interaction.user.id);
    if (!res.success) {
      return interaction.reply({ embeds: [KikiEmbed.error('Cooldown ⏳', res.message)] });
    }
    const embed = KikiEmbed.purple('Obsidian Lake Fishing 🎣',
      `${res.message}\n\n**Reward:** \`+${res.payout} Coins\`\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const res = Economy.fish(message.guild.id, message.author.id);
    if (!res.success) {
      return message.reply({ embeds: [KikiEmbed.error('Cooldown ⏳', res.message)] });
    }
    const embed = KikiEmbed.purple('Obsidian Lake Fishing 🎣',
      `${res.message}\n\n**Reward:** \`+${res.payout} Coins\`\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``
    );
    message.reply({ embeds: [embed] });
  }
};
