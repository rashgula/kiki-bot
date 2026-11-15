
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('mass-timeout').setDescription('⏳ Ek role ke saare members ko timeout karo')
    .addRoleOption(o=>o.setName('role').setDescription('Target role').setRequired(true))
    .addIntegerOption(o=>o.setName('minutes').setDescription('Timeout duration in minutes').setRequired(true).setMinValue(1).setMaxValue(10080))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction, client) {
    await interaction.deferReply();
    const role=interaction.options.getRole('role');
    const mins=interaction.options.getInteger('minutes');
    const until=new Date(Date.now()+mins*60000);
    await interaction.guild.members.fetch();
    let count=0,failed=0;
    for(const [,m] of interaction.guild.members.cache.filter(m=>m.roles.cache.has(role.id)&&!m.user.bot)){
      try{await m.timeout(until-Date.now(),'[KIKI] Mass timeout');count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('Mass Timeout',`Timed out **${count}** members for **${mins}** mins | Failed: **${failed}**`)]});
  },
  name:'mass-timeout',aliases:['mto'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))return;
    const role=message.mentions.roles.first();const mins=parseInt(args[1])||10;if(!role)return;
    let c=0;
    for(const [,m] of message.guild.members.cache.filter(m=>m.roles.cache.has(role.id)&&!m.user.bot)){
      try{await m.timeout(mins*60000);c++;}catch{}
    }
    message.reply({embeds:[KikiEmbed.nuke('Mass Timeout',`${c} members timed out!`)]});
  }
};
