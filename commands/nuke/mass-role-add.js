
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('mass-role-add').setDescription('➕ Saare members ko ek role do')
    .addRoleOption(o=>o.setName('role').setDescription('Role to add').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply();
    const role=interaction.options.getRole('role');
    await interaction.guild.members.fetch();
    let count=0,failed=0;
    for(const [,m] of interaction.guild.members.cache.filter(m=>!m.user.bot)){
      try{await m.roles.add(role);count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.success('Mass Role Add',`Added **${role.name}** to **${count}** members | Failed: **${failed}**`)]});
  },
  name:'mass-role-add',aliases:['mra'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    const role=message.mentions.roles.first();if(!role)return;
    let c=0;
    for(const [,m] of message.guild.members.cache.filter(m=>!m.user.bot)){try{await m.roles.add(role);c++;}catch{}}
    message.reply({embeds:[KikiEmbed.success('Mass Role Add',`${c} members updated!`)]});
  }
};
