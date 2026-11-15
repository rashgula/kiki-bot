const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('afk').setDescription('🌙 Set your AFK status')
    .addStringOption(o => o.setName('reason').setDescription('Reason for being AFK')),
  async execute(interaction) {
    const reason = interaction.options.getString('reason') || 'AFK in the shadows';
    await interaction.reply({ embeds: [KikiEmbed.purple('AFK Status Set 🌙', `${interaction.user.toString()} is now AFK: *${reason}*`)] });
  },
  name: 'afk', aliases: [],
  async run(message, args) {
    const reason = args.join(' ') || 'AFK';
    message.reply({ embeds: [KikiEmbed.purple('AFK', `${message.author.username} is now AFK: ${reason}`)] });
  }
};
