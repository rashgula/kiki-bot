const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const FunEngine = require('../../utils/funEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('marry-propose-user')
    .setDescription('💍 Propose a gothic union to a partner')
    .addUserOption(o => o.setName('user').setDescription('Target partner').setRequired(true)),

  aliases: ['marry', 'propose'],
  name: 'marry-propose-user',

  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const res = FunEngine.marry(interaction.guildId, interaction.user.id, target.id);
    if (!res.success) {
      return interaction.reply({ embeds: [KikiEmbed.error('Marriage Notice 💔', res.message)] });
    }
    const embed = KikiEmbed.success('Gothic Union Sealed! 💍',
      `<@${interaction.user.id}> aur <@${target.id}> ab dark covenant me bandh chuke hain!\n\n*Congratulations! May your shadows intertwine forever.*`
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply({ embeds: [KikiEmbed.error('No Partner', 'Kripya apne partner ko mention karein: `&marry @user`')] });
    }
    const res = FunEngine.marry(message.guild.id, message.author.id, target.id);
    if (!res.success) {
      return message.reply({ embeds: [KikiEmbed.error('Marriage Notice 💔', res.message)] });
    }
    const embed = KikiEmbed.success('Gothic Union Sealed! 💍',
      `<@${message.author.id}> aur <@${target.id}> ab dark covenant me bandh chuke hain!\n\n*Congratulations! May your shadows intertwine forever.*`
    );
    message.reply({ embeds: [embed] });
  }
};
