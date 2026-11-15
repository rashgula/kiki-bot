const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('ship').setDescription('💜 Calculate dark romance compatibility')
    .addUserOption(o => o.setName('user1').setDescription('First user').setRequired(true))
    .addUserOption(o => o.setName('user2').setDescription('Second user')),
  async execute(interaction) {
    const u1 = interaction.options.getUser('user1');
    const u2 = interaction.options.getUser('user2') || interaction.user;
    const percent = Math.floor(Math.random() * 101);
    let desc = `💖 **${percent}%** Compatibility in the Gothic Realm!\n`;
    if (percent > 80) desc += '🔮 A match forged in arcane velvet eternity!';
    else if (percent > 50) desc += '💜 There is dark chemistry here.';
    else desc += '🥀 The shadows say: just friends.';
    await interaction.reply({ embeds: [KikiEmbed.purple(`Ship: ${u1.username} & ${u2.username}`, desc)] });
  },
  name: 'ship', aliases: ['love'],
  async run(message) {
    const users = message.mentions.users;
    if (users.size < 1) return message.reply('Do users mention karo!');
    const percent = Math.floor(Math.random() * 101);
    message.reply({ embeds: [KikiEmbed.purple('Ship Calculator', `Compatibility: **${percent}%**`)] });
  }
};
