
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('prune-members').setDescription('✂️ Inactive members ko kick karo')
    .addIntegerOption(o=>o.setName('days').setDescription('Days of inactivity (1-30)').setRequired(true).setMinValue(1).setMaxValue(30))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction, client) {
    await interaction.deferReply();
    const days=interaction.options.getInteger('days');
    const count=await interaction.guild.members.prune({days,dry:false,reason:`[KIKI] Member prune: ${days}d inactive`});
    await interaction.editReply({embeds:[KikiEmbed.success('Members Pruned',`Kicked **${count}** members inactive for **${days}** days!`)]});
  },
  name:'prune-members',aliases:['prune'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.KickMembers))return;
    const days=parseInt(args[0])||7;
    const count=await message.guild.members.prune({days,dry:false});
    message.reply({embeds:[KikiEmbed.success('Members Pruned',`${count} members pruned!`)]});
  }
};
