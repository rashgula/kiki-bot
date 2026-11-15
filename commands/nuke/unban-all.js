
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('unban-all').setDescription('🔓 Saare banned users ko unban karo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply();
    const bans=await interaction.guild.bans.fetch();
    let count=0,failed=0;
    for(const [,ban] of bans){
      try{await interaction.guild.bans.remove(ban.user.id,'[KIKI] Unban all');count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.success('Unban All',`Unbanned: **${count}** users | Failed: **${failed}**`)]});
  },
  name:'unban-all',aliases:['unbanall'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    const bans=await message.guild.bans.fetch();
    let c=0;for(const [,b] of bans){try{await message.guild.bans.remove(b.user.id);c++;}catch{}}
    message.reply({embeds:[KikiEmbed.success('Unban All',`${c} users unbanned!`)]});
  }
};
