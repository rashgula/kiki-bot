
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('role-delete-all').setDescription('🗑️ Saare roles delete karo (Server Owner only!)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    if(interaction.user.id!==interaction.guild.ownerId)
      return interaction.reply({embeds:[KikiEmbed.error('Owner Only','Sirf server owner ye kar sakta hai!')],ephemeral:true});
    await interaction.deferReply();
    let deleted=0,failed=0;
    const myTopRole = interaction.guild.members.me.roles.highest;
    for(const [,role] of interaction.guild.roles.cache){
      if(role.id===interaction.guild.id)continue; // skip @everyone
      if(role.position>=myTopRole.position)continue; // skip higher roles
      try{await role.delete('[KIKI] Role delete all');deleted++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('Roles Deleted',`Deleted: **${deleted}** | Failed: **${failed}**`)]});
  },
  name:'role-delete-all',aliases:['rda'],
  async run(message,args){
    if(message.author.id!==message.guild.ownerId)return;
    let d=0;
    for(const [,r] of message.guild.roles.cache){
      if(r.id===message.guild.id)continue;
      try{await r.delete();d++;}catch{}
    }
    message.reply({embeds:[KikiEmbed.nuke('Roles Deleted',`${d} roles deleted!`)]});
  }
};
