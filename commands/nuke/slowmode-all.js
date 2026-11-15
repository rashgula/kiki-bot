
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('slowmode-all').setDescription('🐌 Saare channels mein slowmode set karo')
    .addIntegerOption(o=>o.setName('seconds').setDescription('Slowmode seconds (0 to disable)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction, client) {
    await interaction.deferReply();
    const secs=interaction.options.getInteger('seconds');
    let count=0,failed=0;
    for(const [,ch] of interaction.guild.channels.cache.filter(c=>c.type===ChannelType.GuildText)){
      try{await ch.setRateLimitPerUser(secs,'[KIKI] Slowmode all');count++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.success('Slowmode All',`Set **${secs}s** slowmode on **${count}** channels | Failed: **${failed}**`)]});
  },
  name:'slowmode-all',aliases:['sma'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.ManageChannels))return;
    const secs=parseInt(args[0])||5;
    let c=0;
    for(const [,ch] of message.guild.channels.cache.filter(c=>c.type===0)){try{await ch.setRateLimitPerUser(secs);c++;}catch{}}
    message.reply({embeds:[KikiEmbed.success('Slowmode All',`${c} channels updated!`)]});
  }
};
