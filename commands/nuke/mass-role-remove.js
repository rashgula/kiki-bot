
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('mass-role-remove').setDescription('➖ Saare members se ek role hatao')
    .addRoleOption(o=>o.setName('role').setDescription('Role to remove').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply();
    const role=interaction.options.getRole('role');
    await interaction.guild.members.fetch();
    let count=0,failed=0;
    for(const [,m] of interaction.guild.members.cache.filter(m=>m.roles.cache.has(role.id))){
      try{await m.roles.remove(role);count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.success('Mass Role Remove',`Removed **${role.name}** from **${count}** members | Failed: **${failed}**`)]});
  },
  name:'mass-role-remove',aliases:['mrr'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    const role=message.mentions?.roles?.first?.()||(args[0]?message.guild.roles.cache.get(args[0].replace(/[<@&>]/g,'')):null);if(!role)return;
    let c=0;
    for(const [,m] of message.guild.members.cache.filter(m=>m.roles.cache.has(role.id))){try{await m.roles.remove(role);c++;}catch{}}
    message.reply({embeds:[KikiEmbed.success('Mass Role Remove',`${c} members updated!`)]});
  }
};
