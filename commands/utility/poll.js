const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('poll').setDescription('📊 Create an interactive reaction poll')
    .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true)),
  async execute(interaction) {
    const q = interaction.options.getString('question');
    const embed = KikiEmbed.purple('📊 Community Poll', `**${q}**\n\nVote using the reactions below!`)
      .setFooter({ text: `Poll started by ${interaction.user.tag}` });
    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await msg.react('👍');
    await msg.react('👎');
  },
  name: 'poll', aliases: [],
  async run(message, args) {
    const q = args.join(' ');
    if (!q) return message.reply('Poll question likho!');
    const msg = await message.channel.send({ embeds: [KikiEmbed.purple('📊 Poll', q)] });
    await msg.react('👍');
    await msg.react('👎');
  }
};
