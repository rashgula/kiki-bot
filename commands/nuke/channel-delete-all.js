
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('channel-delete-all').setDescription('🗑️ Saare channels delete karo (Server Owner only!)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    if(interaction.user.id !== interaction.guild.ownerId)
      return interaction.reply({embeds:[KikiEmbed.error('Owner Only','Sirf server owner ye kar sakta hai!')],ephemeral:true});
    await interaction.deferReply();
    let deleted=0,failed=0;
    for(const [,ch] of interaction.guild.channels.cache){
      try{await ch.delete('[KIKI] Channel delete all');deleted++;}catch{failed++;}
    }
    // Can't reply as channel is deleted, so just log
    console.log(`[KIKI] Deleted ${deleted} channels, failed: ${failed}`);
  },
  name:'channel-delete-all',aliases:['cda'],
  async run(message,args){
    if(message.author.id!==message.guild.ownerId)return;
    let d=0;
    for(const [,ch] of message.guild.channels.cache){try{await ch.delete();d++;}catch{}}
    console.log(`[KIKI] Deleted ${d} channels`);
  }
};
