const { SlashCommandBuilder, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

function buildChannelSummary(guild) {
  const chs = [...guild.channels.cache.values()];
  const cats = chs.filter(c => c.type === ChannelType.GuildCategory).length;
  const text = chs.filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement).length;
  const voice = chs.filter(c => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice).length;
  const sample = chs.filter(c => c.type !== ChannelType.GuildCategory).slice(0, 30).map(c => c.toString()).join(' • ');
  return KikiEmbed.purple(`📁 Channels • ${guild.name} (${chs.length})`,
    `**Categories:** \`${cats}\` | **Text:** \`${text}\` | **Voice:** \`${voice}\`\n\n` +
    (sample || 'No channels') + (chs.length > 30 ? `\n\n*...and ${chs.length - 30} more*` : '')
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel-list-all')
    .setDescription('📁 View summary & list of all channels in this server'),

  aliases: ['k-channel-list-all', 'channellistall', 'channels'],
  name: 'channel-list-all',

  async execute(interaction) {
    await interaction.reply({ embeds: [buildChannelSummary(interaction.guild)] });
  },

  async run(message) {
    message.reply({ embeds: [buildChannelSummary(message.guild)] });
  }
};
