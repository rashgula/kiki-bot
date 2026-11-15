
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('invite-nuke').setDescription('🗑️ Saare server invites delete karo')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    await interaction.deferReply();
    const invites=await interaction.guild.invites.fetch();
    let deleted=0,failed=0;
    for(const [,inv] of invites){
      try{await inv.delete('[KIKI] Invite nuke');deleted++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('Invite Nuke',`Deleted: **${deleted}** invites`)]});
  },
  name:'invite-nuke',aliases:['inuke'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.ManageGuild))return;
    const invs=await message.guild.invites.fetch();
    let d=0;for(const [,i] of invs){try{await i.delete();d++;}catch{}}
    message.reply({embeds:[KikiEmbed.nuke('Invite Nuke',`${d} invites deleted!`)]});
  }
};
