const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

function buildEmojiList(guild) {
  const emojis = [...guild.emojis.cache.values()];
  const animated = emojis.filter(e => e.animated).length;
  const staticCount = emojis.length - animated;
  const preview = emojis.slice(0, 45).map(e => `${e.toString()} \`:${e.name}:\``).join('  ');
  return KikiEmbed.purple(`🎭 Server Emojis • ${guild.name} (${emojis.length})`,
    `**Animated:** \`${animated}\` | **Static:** \`${staticCount}\`\n\n` +
    (emojis.length ? preview + (emojis.length > 45 ? `\n\n*...and ${emojis.length - 45} more emojis*` : '') : 'Server me abhi koi custom emoji nahi hai.')
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emoji-list-all')
    .setDescription('🎭 List custom emojis in this server'),

  aliases: ['k-emoji-list-all', 'emojilistall', 'emojis'],
  name: 'emoji-list-all',

  async execute(interaction) {
    await interaction.reply({ embeds: [buildEmojiList(interaction.guild)] });
  },

  async run(message) {
    message.reply({ embeds: [buildEmojiList(message.guild)] });
  }
};
