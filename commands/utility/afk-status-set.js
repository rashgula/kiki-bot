const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const AFK = require('../../utils/afk.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk-status-set')
    .setDescription('🌙 Set away from keyboard notice for mentions')
    .addStringOption(o => o.setName('reason').setDescription('AFK reason / message')),

  async execute(interaction) {
    const reason = interaction.options.getString('reason') || 'AFK in the shadows';
    AFK.setAfk(interaction.guildId, interaction.user.id, reason);
    const embed = KikiEmbed.purple('🌙 AFK Notice Set',
      `${interaction.user.toString()} ab AFK hain: **${reason}**\n*(Jab koi aapko mention karega, bot auto-reply kar dega).*`
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'afk-status-set',
  aliases: ['k-afk-status-set', 'afkstatusset', 'setafk'],
  async run(message, args) {
    const reason = args.join(' ') || 'AFK in the shadows';
    AFK.setAfk(message.guild.id, message.author.id, reason);
    const embed = KikiEmbed.purple('🌙 AFK Notice Set',
      `${message.author.toString()} ab AFK hain: **${reason}**`
    );
    message.reply({ embeds: [embed] });
  }
};
