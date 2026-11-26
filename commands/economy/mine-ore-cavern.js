const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mine-ore-cavern')
    .setDescription('⛏️ Dig deep in crystal cavern for amethyst gems'),

  aliases: ['mine', 'mining', 'cavern'],
  name: 'mine-ore-cavern',

  async execute(interaction, client) {
    const res = Economy.mine(interaction.guildId, interaction.user.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return interaction.reply({ embeds: [KikiEmbed.error('Mining Cooldown ⏳', `Cavern me abhi rest karein! Wait: **${wait}**`)] });
    }
    const embed = KikiEmbed.purple('Abyssal Cavern Mining ⛏️',
      `${res.message}\n\n**Reward:** \`+${res.payout.toLocaleString()} Coins\`\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const res = Economy.mine(message.guild.id, message.author.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return message.reply({ embeds: [KikiEmbed.error('Mining Cooldown ⏳', `Cavern me abhi rest karein! Wait: **${wait}**`)] });
    }
    const embed = KikiEmbed.purple('Abyssal Cavern Mining ⛏️',
      `${res.message}\n\n**Reward:** \`+${res.payout.toLocaleString()} Coins\`\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``
    );
    message.reply({ embeds: [embed] });
  }
};
