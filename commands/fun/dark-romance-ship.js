const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dark-romance-ship')
    .setDescription('🖤 Calculate gothic romantic compatibility')
    .addUserOption(o => o.setName('user1').setDescription('First user').setRequired(true))
    .addUserOption(o => o.setName('user2').setDescription('Second user')),

  aliases: ['ship', 'love', 'match'],
  name: 'dark-romance-ship',

  async execute(interaction, client) {
    const u1 = interaction.options.getUser('user1');
    const u2 = interaction.options.getUser('user2') || interaction.user;
    const ship = FunEngine.calculateShip(u1.username, u2.username);
    const embed = KikiEmbed.purple(`🖤 Dark Romance: ${u1.username} & ${u2.username}`,
      `**Compatibility:** ``${ship.percent}%``\n` +
      `**Status:** ${ship.bar}\n\n` +
      `*${ship.comment}*`
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const mentions = message.mentions.users;
    let u1 = mentions.first();
    let u2 = mentions.size > 1 ? Array.from(mentions.values())[1] : message.author;
    if (!u1) u1 = message.author;

    const ship = FunEngine.calculateShip(u1.username, u2.username);
    const embed = KikiEmbed.purple(`🖤 Dark Romance: ${u1.username} & ${u2.username}`,
      `**Compatibility:** ``${ship.percent}%``\n` +
      `**Status:** ${ship.bar}\n\n` +
      `*${ship.comment}*`
    );
    message.reply({ embeds: [embed] });
  }
};
