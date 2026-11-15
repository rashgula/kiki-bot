
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('server-icon-change').setDescription('🖼️ Server icon badlo')
    .addStringOption(o=>o.setName('url').setDescription('Image URL').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const url=interaction.options.getString('url');
    try{
      await interaction.guild.setIcon(url,'[KIKI] Icon change');
      await interaction.reply({embeds:[KikiEmbed.success('Icon Changed',`Server icon updated!\n[View](${url})`).setThumbnail(url)]});
    }catch(e){
      await interaction.reply({embeds:[KikiEmbed.error('Icon Change Failed',e.message)],ephemeral:true});
    }
  },
  name:'server-icon-change',aliases:['sicon'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.ManageGuild))return;
    const url=args[0];if(!url)return;
    try{await message.guild.setIcon(url);message.reply({embeds:[KikiEmbed.success('Icon Changed','Updated!')]});}
    catch(e){message.reply({embeds:[KikiEmbed.error('Failed',e.message)]});}
  }
};
