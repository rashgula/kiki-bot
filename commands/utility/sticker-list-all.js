const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

async function buildStickerList(guild) {
  await guild.stickers.fetch().catch(() => {});
  const stickers = [...guild.stickers.cache.values()];
  const list = stickers.slice(0, 30).map((s, i) => `${i + 1}. **${s.name}** (\`${s.id}\`)`).join('\n');
  return KikiEmbed.purple(`🖼️ Server Stickers • ${guild.name} (${stickers.length})`,
    stickers.length ? list + (stickers.length > 30 ? `\n\n*...and ${stickers.length - 30} more*` : '') : 'Server me koi custom sticker nahi hai.'
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sticker-list-all')
    .setDescription('🖼️ List all custom stickers in this server'),

  aliases: ['k-sticker-list-all', 'stickerlistall', 'stickers'],
  name: 'sticker-list-all',

  async execute(interaction) {
    await interaction.reply({ embeds: [await buildStickerList(interaction.guild)] });
  },

  async run(message) {
    message.reply({ embeds: [await buildStickerList(message.guild)] });
  }
};
