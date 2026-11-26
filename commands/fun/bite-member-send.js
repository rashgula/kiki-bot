const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bite-member-send')
    .setDescription('🧛 Take a playful vampire bite out of someone')
    .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true)),

  aliases: ['k-bite-member-send', 'bitemembersend'],
  name: 'bite-member-send',

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const act = FunEngine.getAction('bite', interaction.user.username, target.username);
    await interaction.reply({ embeds: [KikiEmbed.purple('🧛 Vampire Bite', act.text).setImage(act.gif)] });
  },

  async run(message, args) {
    const cleanId = args[0]?.replace(/[<@!>]/g, '');
    const target = message.mentions?.users?.first?.()
      || (cleanId && /^\d{17,20}$/.test(cleanId) ? message.guild?.members?.cache.get(cleanId)?.user : null)
      || message.author;
    const act = FunEngine.getAction('bite', message.author.username, target.username);
    message.reply({ embeds: [KikiEmbed.purple('🧛 Vampire Bite', act.text).setImage(act.gif)] });
  }
};
