const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard-rich')
    .setDescription('🏆 Gothic wealth leaderboard of richest members'),

  aliases: ['rich', 'ecotop', 'ecolb'],
  name: 'leaderboard-rich',

  async execute(interaction, client) {
    const top = Economy.getLeaderboard(interaction.guildId, 10);
    const medals = ['👑', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const desc = top.length === 0 ?
      'Abhi tak kisi ke paas coins nahi hain. \`&daily\` chala kar pehle banein!' :
      top.map((u, i) => `${medals[i] || '•'} <@${u.userId}> — \`${u.netWorth.toLocaleString()} Coins\` (W: ${u.wallet.toLocaleString()} | B: ${u.bank.toLocaleString()})`).join('\n');

    const embed = KikiEmbed.purple('🏆 Gothic Richest Leaderboard', desc);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const top = Economy.getLeaderboard(message.guild.id, 10);
    const medals = ['👑', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const desc = top.length === 0 ?
      'Abhi tak kisi ke paas coins nahi hain. `&daily` chala kar pehle banein!' :
      top.map((u, i) => `${medals[i] || '•'} <@${u.userId}> — \`${u.netWorth.toLocaleString()} Coins\` (W: ${u.wallet.toLocaleString()} | B: ${u.bank.toLocaleString()})`).join('\n');

    const embed = KikiEmbed.purple('🏆 Gothic Richest Leaderboard', desc);
    message.reply({ embeds: [embed] });
  }
};
