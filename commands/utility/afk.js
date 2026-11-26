const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const AFK = require('../../utils/afk.js');

module.exports = {
  data: new SlashCommandBuilder().setName('afk').setDescription('🌙 Set your AFK status')
    .addStringOption(o => o.setName('reason').setDescription('Reason for being AFK')),
  async execute(interaction) {
    const reason = interaction.options.getString('reason') || 'AFK in the shadows';
    AFK.setAfk(interaction.guildId, interaction.user.id, reason);
    await interaction.reply({ embeds: [KikiEmbed.purple('AFK Status Set 🌙', `${interaction.user.toString()} ab AFK hain: **${reason}**`)] });
  },
  name: 'afk', aliases: [],
  async run(message, args) {
    const reason = args.join(' ') || 'AFK in the shadows';
    AFK.setAfk(message.guild.id, message.author.id, reason);
    message.reply({ embeds: [KikiEmbed.purple('AFK Status Set 🌙', `${message.author.toString()} ab AFK hain: **${reason}**`)] });
  }
};
