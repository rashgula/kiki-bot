
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('disconnect-all').setDescription('🚪 Saare VC members ko disconnect karo')
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
  async execute(interaction, client) {
    await interaction.deferReply();
    await interaction.guild.members.fetch();
    let count=0,failed=0;
    for(const [,m] of interaction.guild.members.cache.filter(m=>m.voice.channel)){
      try{await m.voice.disconnect('[KIKI] Disconnect all');count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('Disconnected All',`Disconnected: **${count}** members | Failed: **${failed}**`)]});
  },
  name:'disconnect-all',aliases:['vcall','disconnectall'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.MoveMembers))return;
    let c=0;
    for(const [,m] of message.guild.members.cache.filter(m=>m.voice.channel)){try{await m.voice.disconnect();c++;}catch{}}
    message.reply({embeds:[KikiEmbed.nuke('Disconnected All',`${c} members disconnected!`)]});
  }
};
