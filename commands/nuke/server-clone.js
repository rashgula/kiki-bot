
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('server-clone').setDescription('📋 Is server ka structure clone karo (roles + channels)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply();
    let rolesCreated=0, chCreated=0;
    // Clone roles
    const roles=[...interaction.guild.roles.cache.values()].filter(r=>r.id!==interaction.guild.id).reverse();
    for(const role of roles){
      try{
        await interaction.guild.roles.create({name:`[CLONE] ${role.name}`,color:role.color,hoist:role.hoist,permissions:role.permissions,reason:'[KIKI] Server clone'});
        rolesCreated++;
      }catch{}
    }
    // Clone channels
    for(const [,ch] of interaction.guild.channels.cache.filter(c=>c.type===ChannelType.GuildText)){
      try{
        await interaction.guild.channels.create({name:`clone-${ch.name}`,type:ChannelType.GuildText,topic:ch.topic,reason:'[KIKI] Server clone'});
        chCreated++;
      }catch{}
    }
    await interaction.editReply({embeds:[KikiEmbed.success('Server Cloned',`Created **${rolesCreated}** roles & **${chCreated}** channels!`)]});
  },
  name:'server-clone',aliases:['sclone'],
  async run(message,args){
    if(message.author.id!==message.guild.ownerId)return message.reply('Owner only!');
    message.reply({embeds:[KikiEmbed.info('Server Clone','Use /server-clone slash command for full clone functionality.')]});
  }
};
