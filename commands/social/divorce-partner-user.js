const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('divorce-partner-user')
    .setDescription('💔 Dissolve your gothic union'),

  aliases: ['divorce', 'breakup'],
  name: 'divorce-partner-user',

  async execute(interaction, client) {
    const res = FunEngine.divorce(interaction.guildId, interaction.user.id);
    if (!res.success) {
      return interaction.reply({ embeds: [KikiEmbed.error('Divorce Notice', res.message)] });
    }
    const embed = KikiEmbed.purple('Gothic Covenant Dissolved 💔', res.message);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const res = FunEngine.divorce(message.guild.id, message.author.id);
    if (!res.success) {
      return message.reply({ embeds: [KikiEmbed.error('Divorce Notice', res.message)] });
    }
    const embed = KikiEmbed.purple('Gothic Covenant Dissolved 💔', res.message);
    message.reply({ embeds: [embed] });
  }
};
