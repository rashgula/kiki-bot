
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('unlock-all').setDescription('🔓 Saare channels unlock karo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply();
    let count=0,failed=0;
    for(const [,ch] of interaction.guild.channels.cache.filter(c=>c.type===ChannelType.GuildText)){
      try{
        await ch.permissionOverwrites.edit(interaction.guild.roles.everyone,{SendMessages:null},'[KIKI] Unlock all');
        count++;
      }catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.success('All Unlocked 🔓',`Unlocked **${count}** channels | Failed: **${failed}**`)]});
  },
  name:'unlock-all',aliases:['unlockdown','unlockall'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    let c=0;
    for(const [,ch] of message.guild.channels.cache.filter(c=>c.type===0)){
      try{await ch.permissionOverwrites.edit(message.guild.roles.everyone,{SendMessages:null});c++;}catch{}
    }
    message.reply({embeds:[KikiEmbed.success('All Unlocked',`${c} channels unlocked!`)]});
  }
};
