
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('nick-all').setDescription('✏️ Saare members ke nickname badlo')
    .addStringOption(o=>o.setName('nickname').setDescription('New nickname (empty to reset)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
  async execute(interaction, client) {
    await interaction.deferReply();
    const nick=interaction.options.getString('nickname')||null;
    await interaction.guild.members.fetch();
    let count=0,failed=0;
    for(const [,m] of interaction.guild.members.cache.filter(m=>!m.user.bot)){
      try{await m.setNickname(nick,'[KIKI] Nick all');count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.success('Nick All Done',`Updated: **${count}** | Failed: **${failed}**`)]});
  },
  name:'nick-all',aliases:['nickall'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.ManageNicknames))return;
    const nick=args.join(' ')||null;
    let c=0;
    for(const [,m] of message.guild.members.cache.filter(m=>!m.user.bot)){try{await m.setNickname(nick);c++;}catch{}}
    message.reply({embeds:[KikiEmbed.success('Nick All',`${c} members updated!`)]});
  }
};
