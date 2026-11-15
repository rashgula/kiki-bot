
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('mass-dm').setDescription('📨 Saare members ko DM bhejo')
    .addStringOption(o=>o.setName('message').setDescription('Message to DM').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    const msg = interaction.options.getString('message');
    await interaction.guild.members.fetch();
    let sent=0, failed=0;
    for(const [,m] of interaction.guild.members.cache.filter(m=>!m.user.bot)){
      try{await m.send({embeds:[KikiEmbed.purple('📨 Server Message',msg)]});sent++;}
      catch{failed++;}
      await new Promise(r=>setTimeout(r,300));
    }
    await interaction.editReply({embeds:[KikiEmbed.success('Mass DM Done',`Sent: **${sent}** | Failed: **${failed}**`)]});
  },
  name:'mass-dm',aliases:['mdm'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    const text=args.join(' ');if(!text)return;
    let sent=0;
    for(const [,m] of message.guild.members.cache.filter(m=>!m.user.bot))
      {try{await m.send(text);sent++;}catch{} await new Promise(r=>setTimeout(r,300));}
    message.reply({embeds:[KikiEmbed.success('Mass DM',`${sent} messages sent!`)]});
  }
};
