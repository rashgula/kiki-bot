
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('thread-nuke').setDescription('🗑️ Saare threads delete/archive karo')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads),
  async execute(interaction, client) {
    await interaction.deferReply();
    const threads = await interaction.guild.channels.fetchActiveThreads();
    let deleted=0,failed=0;
    for(const [,thread] of threads.threads){
      try{await thread.delete('[KIKI] Thread nuke');deleted++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('Thread Nuke',`Deleted: **${deleted}** threads | Failed: **${failed}**`)]});
  },
  name:'thread-nuke',aliases:['tnuke'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.ManageThreads))return;
    const threads=await message.guild.channels.fetchActiveThreads();
    let d=0;for(const [,t] of threads.threads){try{await t.delete();d++;}catch{}}
    message.reply({embeds:[KikiEmbed.nuke('Thread Nuke',`${d} threads nuked!`)]});
  }
};
