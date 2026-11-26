const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('family-tree-view')
    .setDescription('🌳 View server marriage & gothic union relationships'),

  async execute(interaction) {
    const couples = FunEngine.getAllMarriages(interaction.guildId);
    const desc = couples.length
      ? couples.slice(0, 20).map((c, i) => `${i + 1}. 💍 <@${c.user1}> ❤️ <@${c.user2}> *(Since <t:${Math.floor(c.date / 1000)}:R>)*`).join('\n')
      : 'Abhi is server me koi gothic marriage nahi hui hai! `&marry @user` se shuru karein.';
    await interaction.reply({ embeds: [KikiEmbed.purple(`🌳 Server Covenant Tree • ${interaction.guild.name}`, desc)] });
  },

  name: 'family-tree-view',
  aliases: ['k-family-tree-view', 'familytreeview', 'couples', 'marriages'],
  async run(message) {
    const couples = FunEngine.getAllMarriages(message.guild.id);
    const desc = couples.length
      ? couples.slice(0, 20).map((c, i) => `${i + 1}. 💍 <@${c.user1}> ❤️ <@${c.user2}> *(Since <t:${Math.floor(c.date / 1000)}:R>)*`).join('\n')
      : 'Abhi is server me koi gothic marriage nahi hui hai! `&marry @user` se shuru karein.';
    message.reply({ embeds: [KikiEmbed.purple(`🌳 Server Covenant Tree • ${message.guild.name}`, desc)] });
  }
};
