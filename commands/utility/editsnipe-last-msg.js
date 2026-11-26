const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const MessageCache = require('../../utils/messageCache.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editsnipe-last-msg')
    .setDescription('✏️ Reveal the last edited message (Before & After)')
    .addIntegerOption(o => o.setName('index').setDescription('1 = latest, 2 = second latest...').setMinValue(1).setMaxValue(10)),

  aliases: ['k-editsnipe-last-msg', 'editsnipelastmsg', 'editsnipe'],
  name: 'editsnipe-last-msg',

  async execute(interaction) {
    const idx = (interaction.options.getInteger('index') || 1) - 1;
    const item = MessageCache.getLastEdited(interaction.channelId, idx);
    if (!item) {
      return interaction.reply({ embeds: [KikiEmbed.info('Nothing to Edit-Snipe ✏️', 'Is channel me abhi koi recent edited message nahi mila.')], ephemeral: true });
    }
    const embed = KikiEmbed.purple(`✏️ Edit Snipe #${idx + 1}`,
      `**Author:** ${item.authorTag}\n**Edited:** <t:${Math.floor(item.editedAt / 1000)}:R>\n\n` +
      `**Before:**\n${item.oldContent || '*[Empty]*'}\n\n**After:**\n${item.newContent || '*[Empty]*'}`
    );
    if (item.authorAvatar) embed.setThumbnail(item.authorAvatar);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args) {
    const idx = Math.max(0, Math.min(9, (parseInt(args[0], 10) || 1) - 1));
    const item = MessageCache.getLastEdited(message.channel.id, idx);
    if (!item) {
      return message.reply({ embeds: [KikiEmbed.info('Nothing to Edit-Snipe ✏️', 'Is channel me abhi koi recent edited message nahi mila.')] });
    }
    const embed = KikiEmbed.purple(`✏️ Edit Snipe #${idx + 1}`,
      `**Author:** ${item.authorTag}\n**Edited:** <t:${Math.floor(item.editedAt / 1000)}:R>\n\n` +
      `**Before:**\n${item.oldContent || '*[Empty]*'}\n\n**After:**\n${item.newContent || '*[Empty]*'}`
    );
    if (item.authorAvatar) embed.setThumbnail(item.authorAvatar);
    message.reply({ embeds: [embed] });
  }
};
