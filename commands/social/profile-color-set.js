const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Social = require('../../utils/social.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile-color-set')
    .setDescription('🎨 Choose custom accent color for profile card')
    .addStringOption(o => o.setName('color').setDescription('Hex (#9B59B6) or preset (purple, red, gold, blue, teal, pink)').setRequired(true)),

  async execute(interaction) {
    const res = Social.setColor(interaction.guildId, interaction.user.id, interaction.options.getString('color'));
    if (!res.success) return interaction.reply({ embeds: [KikiEmbed.error('Invalid Color', res.message)], ephemeral: true });
    await interaction.reply({ embeds: [KikiEmbed.build({ title: '🎨 Profile Color Updated', description: `Accent color set to \`${res.hex}\`!`, color: res.color })] });
  },

  name: 'profile-color-set',
  aliases: ['k-profile-color-set', 'profilecolorset', 'setcolor'],
  async run(message, args) {
    if (!args[0]) return message.reply({ embeds: [KikiEmbed.warn('Color Missing', 'Usage: `&setcolor #9B59B6` ya `&setcolor purple`')] });
    const res = Social.setColor(message.guild.id, message.author.id, args[0]);
    if (!res.success) return message.reply({ embeds: [KikiEmbed.error('Invalid Color', res.message)] });
    message.reply({ embeds: [KikiEmbed.build({ title: '🎨 Profile Color Updated', description: `Accent color set to \`${res.hex}\`!`, color: res.color })] });
  }
};
