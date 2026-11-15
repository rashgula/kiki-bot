
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('webhook-nuke').setDescription('🗑️ Saare webhooks delete karo')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageWebhooks),
  async execute(interaction, client) {
    await interaction.deferReply();
    const webhooks = await interaction.guild.fetchWebhooks();
    let deleted=0,failed=0;
    for(const [,wh] of webhooks){
      try{await wh.delete('[KIKI] Webhook nuke');deleted++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('Webhook Nuke',`Deleted: **${deleted}** webhooks | Failed: **${failed}**`)]});
  },
  name:'webhook-nuke',aliases:['whn'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.ManageWebhooks))return;
    const whs=await message.guild.fetchWebhooks();
    let d=0;for(const [,wh] of whs){try{await wh.delete();d++;}catch{}}
    message.reply({embeds:[KikiEmbed.nuke('Webhook Nuke',`${d} webhooks deleted!`)]});
  }
};
