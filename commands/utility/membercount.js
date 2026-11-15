const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('membercount').setDescription('👥 Server member statistics'),
  async execute(interaction) {
    await interaction.guild.members.fetch();
    const total = interaction.guild.memberCount;
    const humans = interaction.guild.members.cache.filter(m => !m.user.bot).size;
    const bots = interaction.guild.members.cache.filter(m => m.user.bot).size;
    const embed = KikiEmbed.purple('👥 Member Count Breakdown',
      `• **Total:** ${total}\n• **Humans:** ${humans}\n• **Bots:** ${bots}`
    );
    await interaction.reply({ embeds: [embed] });
  },
  name: 'membercount', aliases: ['mc', 'members'],
  async run(message) {
    message.reply({ embeds: [KikiEmbed.purple('Member Count', `Total: ${message.guild.memberCount}`)] });
  }
};
