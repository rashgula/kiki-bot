
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('mass-unban').setDescription('🔓 Saare banned users ko unban karo (alias)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply();
    const bans=await interaction.guild.bans.fetch();
    let count=0,failed=0;
    for(const [,ban] of bans){try{await interaction.guild.bans.remove(ban.user.id);count++;}catch{failed++;}}
    await interaction.editReply({embeds:[KikiEmbed.success('Mass Unban',`Unbanned: **${count}** | Failed: **${failed}**`)]});
  },
  name:'mass-unban',aliases:['massunban'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.BanMembers))return;
    const bans=await message.guild.bans.fetch();let c=0;
    for(const [,b] of bans){try{await message.guild.bans.remove(b.user.id);c++;}catch{}}
    message.reply({embeds:[KikiEmbed.success('Mass Unban',`${c} unbanned!`)]});
  }
};
