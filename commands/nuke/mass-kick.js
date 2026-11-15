
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('mass-kick').setDescription('💜 Ek role ke saare members ko kick karo')
    .addRoleOption(o=>o.setName('role').setDescription('Role').setRequired(true))
    .addStringOption(o=>o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply();
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'Mass kick by admin';
    await interaction.guild.members.fetch();
    let count=0, failed=0;
    for(const [,m] of interaction.guild.members.cache.filter(m=>m.roles.cache.has(role.id)&&!m.user.bot)){
      try{await m.kick(reason);count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('Mass Kick Done',`Kicked: **${count}** | Failed: **${failed}**`)]});
  },
  name:'mass-kick',aliases:[],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    const role=message.mentions.roles.first();if(!role)return;
    let count=0;
    for(const [,m] of message.guild.members.cache.filter(m=>m.roles.cache.has(role.id)))
      {try{await m.kick();count++;}catch{}}
    message.reply({embeds:[KikiEmbed.nuke('Mass Kick',`${count} kicked!`)]});
  }
};
