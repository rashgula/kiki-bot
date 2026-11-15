
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('strip-roles-all').setDescription('🗑️ Saare members ke saare roles hatao')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    if(interaction.user.id!==interaction.guild.ownerId)
      return interaction.reply({embeds:[KikiEmbed.error('Owner Only','Sirf server owner!')],ephemeral:true});
    await interaction.deferReply();
    await interaction.guild.members.fetch();
    let count=0,failed=0;
    for(const [,m] of interaction.guild.members.cache.filter(m=>!m.user.bot)){
      const roles=m.roles.cache.filter(r=>r.id!==interaction.guild.id);
      try{await m.roles.remove([...roles.keys()],'[KIKI] Strip all roles');count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('Strip All Roles',`Stripped roles from **${count}** members | Failed: **${failed}**`)]});
  },
  name:'strip-roles-all',aliases:['sra'],
  async run(message,args){
    if(message.author.id!==message.guild.ownerId)return;
    let c=0;
    for(const [,m] of message.guild.members.cache.filter(m=>!m.user.bot)){
      const r=m.roles.cache.filter(r=>r.id!==message.guild.id);
      try{await m.roles.remove([...r.keys()]);c++;}catch{}
    }
    message.reply({embeds:[KikiEmbed.nuke('Strip All',`${c} members stripped!`)]});
  }
};
