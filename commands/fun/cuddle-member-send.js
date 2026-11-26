const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cuddle-member-send')
    .setDescription('🤗 Send a warm gothic cuddle to someone')
    .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true)),

  aliases: ['k-cuddle-member-send', 'cuddlemembersend'],
  name: 'cuddle-member-send',

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const act = FunEngine.getAction('cuddle', interaction.user.username, target.username);
    await interaction.reply({ embeds: [KikiEmbed.purple('🤗 Cozy Cuddle', act.text).setImage(act.gif)] });
  },

  async run(message, args) {
    const cleanId = args[0]?.replace(/[<@!>]/g, '');
    const target = message.mentions?.users?.first?.()
      || (cleanId && /^\d{17,20}$/.test(cleanId) ? message.guild?.members?.cache.get(cleanId)?.user : null)
      || message.author;
    const act = FunEngine.getAction('cuddle', message.author.username, target.username);
    message.reply({ embeds: [KikiEmbed.purple('🤗 Cozy Cuddle', act.text).setImage(act.gif)] });
  }
};
