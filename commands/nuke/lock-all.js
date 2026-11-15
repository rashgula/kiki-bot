
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('lock-all').setDescription('🔒 Saare channels lock karo (emergency lockdown)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply();
    let count=0,failed=0;
    for(const [,ch] of interaction.guild.channels.cache.filter(c=>c.type===ChannelType.GuildText)){
      try{
        await ch.permissionOverwrites.edit(interaction.guild.roles.everyone,{SendMessages:false},'[KIKI] Lock all');
        count++;
      }catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('All Locked 🔒',`Locked **${count}** channels | Failed: **${failed}**`)]});
  },
  name:'lock-all',aliases:['lockdown','lockall'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    let c=0;
    for(const [,ch] of message.guild.channels.cache.filter(c=>c.type===0)){
      try{await ch.permissionOverwrites.edit(message.guild.roles.everyone,{SendMessages:false});c++;}catch{}
    }
    message.reply({embeds:[KikiEmbed.nuke('All Locked',`${c} channels locked!`)]});
  }
};
