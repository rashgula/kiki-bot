const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gothic-roast-user')
    .setDescription('🔥 Deliver a savage gothic roast')
    .addUserOption(o => o.setName('user').setDescription('Target to roast')),

  aliases: ['groast', 'burn'],
  name: 'gothic-roast-user',

  async execute(interaction, client) {
    const target = interaction.options.getUser('user') || interaction.user;
    const r = FunEngine.getRoast(target.username);
    const embed = KikiEmbed.error(`🔥 Roast for ${target.username}`, r);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const target = message.mentions?.users?.first?.() || message.author;
    const r = FunEngine.getRoast(target.username);
    const embed = KikiEmbed.error(`🔥 Roast for ${target.username}`, r);
    message.reply({ embeds: [embed] });
  }
};
