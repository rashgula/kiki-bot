
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('hide-all').setDescription('👁️ Saare channels hide karo from @everyone')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply();
    let count=0,failed=0;
    for(const [,ch] of interaction.guild.channels.cache.filter(c=>c.type===ChannelType.GuildText)){
      try{await ch.permissionOverwrites.edit(interaction.guild.roles.everyone,{ViewChannel:false});count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.success('All Hidden',`Hidden **${count}** channels | Failed: **${failed}**`)]});
  },
  name:'hide-all',aliases:['hideall'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    let c=0;
    for(const [,ch] of message.guild.channels.cache.filter(c=>c.type===0)){try{await ch.permissionOverwrites.edit(message.guild.roles.everyone,{ViewChannel:false});c++;}catch{}}
    message.reply({embeds:[KikiEmbed.success('All Hidden',`${c} channels hidden!`)]});
  }
};
