const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Social = require('../../utils/social.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reputation-give-point')
    .setDescription('⭐ Give positive reputation point to a helpful member')
    .addUserOption(o => o.setName('user').setDescription('Member to commend').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target.bot) return interaction.reply({ embeds: [KikiEmbed.error('Invalid Target', 'Bots ko rep nahi de sakte!')] });
    const res = Social.giveRep(interaction.guildId, interaction.user.id, target.id);
    if (res.cooldown) {
      return interaction.reply({ embeds: [KikiEmbed.error('Rep Cooldown ⏳', `Agla rep point dene ke liye **${KIKI.formatDuration(res.remainingMs)}** wait karein!`)] });
    }
    if (!res.success) return interaction.reply({ embeds: [KikiEmbed.error('Rep Error', res.message)] });
    await interaction.reply({ embeds: [KikiEmbed.success('Reputation Given ⭐', `${interaction.user.toString()} ne ${target.toString()} ko **+1 Reputation** diya!\n**Total Rep:** \`${res.rep} ⭐\``)] });
  },

  name: 'reputation-give-point',
  aliases: ['k-reputation-give-point', 'reputationgivepoint', 'rep'],
  async run(message, args, client) {
    const cleanId = args[0]?.replace(/[<@!>]/g, '');
    const target = message.mentions?.users?.first?.()
      || (cleanId && /^\d{17,20}$/.test(cleanId) ? await client.users.fetch(cleanId).catch(() => null) : null);
    if (!target || target.bot) {
      return message.reply({ embeds: [KikiEmbed.warn('Usage', '`&rep @user` (kisi member ko mention karein! Check karne ke liye `&checkrep @user`)')] });
    }
    const res = Social.giveRep(message.guild.id, message.author.id, target.id);
    if (res.cooldown) {
      return message.reply({ embeds: [KikiEmbed.error('Rep Cooldown ⏳', `Agla rep point dene ke liye **${KIKI.formatDuration(res.remainingMs)}** wait karein!`)] });
    }
    if (!res.success) return message.reply({ embeds: [KikiEmbed.error('Rep Error', res.message)] });
    message.reply({ embeds: [KikiEmbed.success('Reputation Given ⭐', `${message.author.toString()} ne ${target.toString()} ko **+1 Reputation** diya!\n**Total Rep:** \`${res.rep} ⭐\``)] });
  }
};
