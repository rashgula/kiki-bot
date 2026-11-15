
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('category-delete-all').setDescription('🗑️ Saari channel categories delete karo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    if(interaction.user.id!==interaction.guild.ownerId)
      return interaction.reply({embeds:[KikiEmbed.error('Owner Only','Sirf server owner!')],ephemeral:true});
    await interaction.deferReply();
    let deleted=0,failed=0;
    for(const [,ch] of interaction.guild.channels.cache.filter(c=>c.type===ChannelType.GuildCategory)){
      try{await ch.delete();deleted++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('Categories Deleted',`Deleted: **${deleted}** categories | Failed: **${failed}**`)]});
  },
  name:'category-delete-all',aliases:['cda2','catdel'],
  async run(message,args){
    if(message.author.id!==message.guild.ownerId)return;
    let d=0;
    for(const [,ch] of message.guild.channels.cache.filter(c=>c.type===4)){try{await ch.delete();d++;}catch{}}
    message.reply({embeds:[KikiEmbed.nuke('Categories Deleted',`${d} deleted!`)]});
  }
};
