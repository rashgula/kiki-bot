
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('sticker-delete-all').setDescription('🗑️ Saare custom stickers delete karo')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),
  async execute(interaction, client) {
    await interaction.deferReply();
    const stickers=await interaction.guild.stickers.fetch();
    let deleted=0,failed=0;
    for(const [,st] of stickers){try{await st.delete('[KIKI] Sticker nuke');deleted++;}catch{failed++;}}
    await interaction.editReply({embeds:[KikiEmbed.nuke('Sticker Nuke',`Deleted: **${deleted}** stickers | Failed: **${failed}**`)]});
  },
  name:'sticker-delete-all',aliases:['snuke'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))return;
    const stickers=await message.guild.stickers.fetch();
    let d=0;for(const [,s] of stickers){try{await s.delete();d++;}catch{}}
    message.reply({embeds:[KikiEmbed.nuke('Sticker Nuke',`${d} stickers deleted!`)]});
  }
};
