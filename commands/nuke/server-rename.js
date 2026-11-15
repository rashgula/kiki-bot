
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('server-rename').setDescription('✏️ Server ka naam badlo')
    .addStringOption(o=>o.setName('name').setDescription('New server name').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const name=interaction.options.getString('name');
    const old=interaction.guild.name;
    await interaction.guild.setName(name,'[KIKI] Server rename');
    await interaction.reply({embeds:[KikiEmbed.success('Server Renamed',`**${old}** → **${name}**`)]});
  },
  name:'server-rename',aliases:['srename'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.ManageGuild))return;
    const name=args.join(' ');if(!name)return;
    const old=message.guild.name;
    await message.guild.setName(name);
    message.reply({embeds:[KikiEmbed.success('Server Renamed',`**${old}** → **${name}**`)]});
  }
};
