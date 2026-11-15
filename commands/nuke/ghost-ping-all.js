
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('ghost-ping-all').setDescription('👻 @everyone ghost ping bhejo (send then delete)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.reply({embeds:[KikiEmbed.info('Ghost Ping','Sending...')],ephemeral:true});
    const msg=await interaction.channel.send('@everyone 👻 KIKI Ghost Ping!');
    await new Promise(r=>setTimeout(r,100));
    try{await msg.delete();}catch{}
  },
  name:'ghost-ping-all',aliases:['ghostping','gpa'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    const m=await message.channel.send('@everyone');
    await message.delete().catch(()=>{});
    await new Promise(r=>setTimeout(r,100));
    await m.delete().catch(()=>{});
  }
};
