const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const MessageCache = require('../../utils/messageCache.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('snipe-last-deleted')
    .setDescription('🔫 Reveal the last deleted message in this channel')
    .addIntegerOption(o => o.setName('index').setDescription('1 = latest, 2 = second latest...').setMinValue(1).setMaxValue(10)),

  aliases: ['k-snipe-last-deleted', 'snipelastdeleted', 'snipe'],
  name: 'snipe-last-deleted',

  async execute(interaction) {
    const idx = (interaction.options.getInteger('index') || 1) - 1;
    const item = MessageCache.getLastDeleted(interaction.channelId, idx);
    if (!item) {
      return interaction.reply({ embeds: [KikiEmbed.info('Nothing to Snipe 👻', 'Is channel me abhi koi recent deleted message nahi mila.')], ephemeral: true });
    }
    const embed = KikiEmbed.purple(`🔫 Sniped Deleted Message #${idx + 1}`,
      `**Author:** ${item.authorTag}\n**Deleted:** <t:${Math.floor(item.deletedAt / 1000)}:R>\n\n**Message:**\n${item.content || '*[Media Attachment Only]*'}`
    );
    if (item.authorAvatar) embed.setThumbnail(item.authorAvatar);
    if (item.attachments?.[0]) embed.setImage(item.attachments[0]);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args) {
    const idx = Math.max(0, Math.min(9, (parseInt(args[0], 10) || 1) - 1));
    const item = MessageCache.getLastDeleted(message.channel.id, idx);
    if (!item) {
      return message.reply({ embeds: [KikiEmbed.info('Nothing to Snipe 👻', 'Is channel me abhi koi recent deleted message nahi mila.')] });
    }
    const embed = KikiEmbed.purple(`🔫 Sniped Deleted Message #${idx + 1}`,
      `**Author:** ${item.authorTag}\n**Deleted:** <t:${Math.floor(item.deletedAt / 1000)}:R>\n\n**Message:**\n${item.content || '*[Media Attachment Only]*'}`
    );
    if (item.authorAvatar) embed.setThumbnail(item.authorAvatar);
    if (item.attachments?.[0]) embed.setImage(item.attachments[0]);
    message.reply({ embeds: [embed] });
  }
};
