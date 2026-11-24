const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('🖤 Calculate dark romance compatibility')
    .addUserOption(o => o.setName('user1').setDescription('First user').setRequired(false))
    .addUserOption(o => o.setName('user2').setDescription('Second user').setRequired(false)),

  name: 'ship',
  aliases: ['love', 'match'],

  async execute(interaction, client) {
    const u1 = interaction.options.getUser('user1') || interaction.user;
    const u2 = interaction.options.getUser('user2') ||
      interaction.guild?.members.cache.filter(m => !m.user.bot && m.id !== u1.id).random()?.user ||
      client.user || { id: 'bot', username: 'KIKI Shadow' };

    const ship = FunEngine.calculateShip(u1, u2);
    const embed = KikiEmbed.purple(`🖤 Dark Romance: ${u1.username} & ${u2.username}`,
      `**Compatibility:** \`${ship.percent}%\`\n` +
      `**Status:** ${ship.bar}\n\n` +
      `*${ship.verdict || ship.comment}*`
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const mentions = message.mentions?.users;
    let u1, u2;

    if (mentions && mentions.size >= 2) {
      const arr = Array.from(mentions.values());
      u1 = arr[0];
      u2 = arr[1];
    } else if (mentions && mentions.size === 1) {
      u1 = message.author;
      u2 = mentions.first();
    } else if (args && args.length >= 2) {
      const clean1 = args[0].replace(/[<@!>]/g, '');
      const clean2 = args[1].replace(/[<@!>]/g, '');
      u1 = message.guild?.members.cache.find(m => m.id === clean1 || m.user.username.toLowerCase() === clean1.toLowerCase())?.user || { id: clean1, username: args[0] };
      u2 = message.guild?.members.cache.find(m => m.id === clean2 || m.user.username.toLowerCase() === clean2.toLowerCase())?.user || { id: clean2, username: args[1] };
    } else if (args && args.length === 1) {
      const clean1 = args[0].replace(/[<@!>]/g, '');
      u1 = message.author;
      u2 = message.guild?.members.cache.find(m => m.id === clean1 || m.user.username.toLowerCase() === clean1.toLowerCase())?.user || { id: clean1, username: args[0] };
    } else {
      u1 = message.author;
      u2 = message.guild?.members.cache.filter(m => !m.user.bot && m.id !== message.author.id).random()?.user ||
        client.user || { id: 'bot', username: 'KIKI Shadow' };
    }

    const ship = FunEngine.calculateShip(u1, u2);
    const embed = KikiEmbed.purple(`🖤 Dark Romance: ${u1.username} & ${u2.username}`,
      `**Compatibility:** \`${ship.percent}%\`\n` +
      `**Status:** ${ship.bar}\n\n` +
      `*${ship.verdict || ship.comment}*`
    );
    message.reply({ embeds: [embed] });
  }
};
