
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('channel-flood').setDescription('💜 Multiple text channels create karo')
    .addStringOption(o=>o.setName('name').setDescription('Channel name prefix').setRequired(true))
    .addIntegerOption(o=>o.setName('amount').setDescription('Number of channels (max 20)').setRequired(true).setMinValue(1).setMaxValue(20))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    await interaction.deferReply();
    const name = interaction.options.getString('name');
    const amount = interaction.options.getInteger('amount');
    let created=0;
    for(let i=1;i<=amount;i++){
      try{await interaction.guild.channels.create({name:`${name}-${i}`,type:ChannelType.GuildText});created++;}catch{}
    }
    await interaction.editReply({embeds:[KikiEmbed.success('Channel Flood',`Created **${created}** channels!`)]});
  },
  name:'channel-flood',aliases:['cflood'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    const name=args[0]||'kiki';const amt=Math.min(parseInt(args[1])||5,20);
    let c=0;
    for(let i=1;i<=amt;i++){try{await message.guild.channels.create({name:`${name}-${i}`,type:1});c++;}catch{}}
    message.reply({embeds:[KikiEmbed.success('Channel Flood',`${c} channels created!`)]});
  }
};
