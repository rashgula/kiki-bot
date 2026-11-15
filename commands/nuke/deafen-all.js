
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('deafen-all').setDescription('🔇 Saare VC members ko deafen karo')
    .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
  async execute(interaction, client) {
    await interaction.deferReply();
    await interaction.guild.members.fetch();
    let count=0,failed=0;
    for(const [,m] of interaction.guild.members.cache.filter(m=>m.voice.channel)){
      try{await m.voice.setDeaf(true,'[KIKI] Deafen all');count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('Deafen All',`Deafened: **${count}** | Failed: **${failed}**`)]});
  },
  name:'deafen-all',aliases:['deafenall'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.DeafenMembers))return;
    let c=0;
    for(const [,m] of message.guild.members.cache.filter(m=>m.voice.channel)){try{await m.voice.setDeaf(true);c++;}catch{}}
    message.reply({embeds:[KikiEmbed.nuke('Deafen All',`${c} members deafened!`)]});
  }
};
