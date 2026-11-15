
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('purge-bots').setDescription('🤖 Saare bots ko server se kick karo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply();
    await interaction.guild.members.fetch();
    let count=0,failed=0;
    for(const [,m] of interaction.guild.members.cache.filter(m=>m.user.bot&&m.id!==client.user.id)){
      try{await m.kick('[KIKI] Bot purge');count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.success('Bots Purged',`Kicked **${count}** bots | Failed: **${failed}**`)]});
  },
  name:'purge-bots',aliases:['kickbots','botpurge'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    let c=0;
    for(const [,m] of message.guild.members.cache.filter(m=>m.user.bot&&m.id!==message.client.user.id)){try{await m.kick();c++;}catch{}}
    message.reply({embeds:[KikiEmbed.success('Bots Purged',`${c} bots removed!`)]});
  }
};
